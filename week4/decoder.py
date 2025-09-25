import numpy as np
import trimesh
import librosa
from scipy import ndimage, interpolate
from sklearn.cluster import DBSCAN
import matplotlib.pyplot as plt

class HelicalAudioDecoder:
    def __init__(self):
        # Known encoding parameters (must match encoder)
        self.base_radius = 15  # mm
        self.pitch = 8         # mm per revolution 
        self.min_thickness = 2 # mm
        self.max_thickness = 8 # mm
        self.sample_rate = 22050
        
    def load_scanned_mesh(self, stl_filename):
        """Load 3D scanned STL file"""
        print(f"Loading scanned mesh: {stl_filename}")
        mesh = trimesh.load(stl_filename)
        
        if not isinstance(mesh, trimesh.Trimesh):
            raise ValueError("Failed to load valid mesh from STL file")
            
        print(f"Mesh loaded: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces")
        return mesh
    
    def extract_helical_centerline(self, mesh):
        """Extract the central helical path from the mesh"""
        vertices = mesh.vertices
        
        # Convert to cylindrical coordinates to find helix center
        x, y, z = vertices[:, 0], vertices[:, 1], vertices[:, 2]
        
        # Calculate radius and angle for each vertex
        radii = np.sqrt(x**2 + y**2)
        angles = np.arctan2(y, x)
        
        # Group vertices by height slices to find centerline
        z_min, z_max = np.min(z), np.max(z)
        num_slices = int((z_max - z_min) / 1.0) + 1  # 1mm slices
        
        centerline_points = []
        slice_heights = []
        
        for i in range(num_slices):
            slice_z = z_min + i * (z_max - z_min) / (num_slices - 1)
            
            # Find vertices close to this height
            height_mask = np.abs(z - slice_z) < 1.0  # 1mm tolerance
            if not np.any(height_mask):
                continue
                
            slice_vertices = vertices[height_mask]
            slice_x, slice_y = slice_vertices[:, 0], slice_vertices[:, 1]
            slice_radii = np.sqrt(slice_x**2 + slice_y**2)
            
            # Find vertices closest to expected helix radius
            expected_radius = self.base_radius
            radius_diff = np.abs(slice_radii - expected_radius)
            close_to_center = radius_diff < 5.0  # 5mm tolerance
            
            if np.any(close_to_center):
                # Average position of vertices near expected radius
                center_vertices = slice_vertices[close_to_center]
                center_point = np.mean(center_vertices, axis=0)
                
                centerline_points.append(center_point)
                slice_heights.append(slice_z)
        
        if len(centerline_points) < 10:
            raise ValueError("Could not extract sufficient centerline points")
            
        centerline = np.array(centerline_points)
        print(f"Extracted {len(centerline)} centerline points")
        
        return centerline, np.array(slice_heights)
    
    def measure_thickness_along_helix(self, mesh, centerline):
        """Measure cross-sectional thickness at points along the helix"""
        vertices = mesh.vertices
        thickness_measurements = []
        angles = []
        heights = []
        
        for i, center_point in enumerate(centerline):
            cx, cy, cz = center_point
            
            # Find all vertices within measurement radius of this centerline point
            distances = np.sqrt((vertices[:, 0] - cx)**2 + 
                              (vertices[:, 1] - cy)**2 + 
                              (vertices[:, 2] - cz)**2)
            
            # Select vertices within 10mm radius of centerline point
            nearby_mask = distances < 10.0
            if not np.any(nearby_mask):
                thickness_measurements.append(self.min_thickness)  # fallback
                continue
                
            nearby_vertices = vertices[nearby_mask]
            
            # Calculate distances from centerline to nearby vertices
            radial_distances = []
            for vertex in nearby_vertices:
                vx, vy, vz = vertex
                
                # Distance from centerline point to vertex (ignoring z for thickness)
                radial_dist = np.sqrt((vx - cx)**2 + (vy - cy)**2)
                radial_distances.append(radial_dist)
            
            if radial_distances:
                # Thickness = average distance from centerline to mesh surface
                # Subtract base_radius to get thickness variation
                avg_surface_radius = np.mean(radial_distances)
                thickness = max(self.min_thickness, 
                              min(self.max_thickness, avg_surface_radius))
                thickness_measurements.append(thickness)
                
                # Calculate angle for time reconstruction
                angle = np.arctan2(cy, cx)
                if angle < 0:
                    angle += 2 * np.pi
                    
                angles.append(angle)
                heights.append(cz)
            else:
                thickness_measurements.append(self.min_thickness)
                angles.append(0)
                heights.append(cz)
        
        return np.array(thickness_measurements), np.array(angles), np.array(heights)
    
    def reconstruct_temporal_sequence(self, thickness_measurements, angles, heights):
        """Convert helical measurements back to temporal audio sequence"""
        
        # Calculate time parameter from height (since helix grows vertically with time)
        # Each revolution = 2π radians = pitch mm of height
        total_rotations = (np.max(heights) - np.min(heights)) / self.pitch
        
        print(f"Detected {total_rotations:.1f} rotations in helix")
        
        # Sort measurements by height (time progression)
        sort_indices = np.argsort(heights)
        sorted_thickness = thickness_measurements[sort_indices]
        sorted_heights = heights[sort_indices]
        sorted_angles = angles[sort_indices]
        
        # Convert thickness back to amplitude (reverse the encoding)
        # thickness = min_thickness + amplitude * (max_thickness - min_thickness)
        amplitude_range = self.max_thickness - self.min_thickness
        amplitudes = (sorted_thickness - self.min_thickness) / amplitude_range
        amplitudes = np.clip(amplitudes, 0.0, 1.0)  # ensure valid range
        
        print(f"Reconstructed {len(amplitudes)} amplitude measurements")
        print(f"Amplitude range: {np.min(amplitudes):.3f} to {np.max(amplitudes):.3f}")
        
        return amplitudes, sorted_heights
    
    def interpolate_to_audio_rate(self, amplitudes, heights, target_duration=20):
        """Interpolate measured amplitudes to audio sample rate"""
        
        # Create target time grid
        num_samples = int(target_duration * self.sample_rate)
        target_times = np.linspace(0, target_duration, num_samples)
        
        # Map heights to time (assuming linear growth)
        height_range = np.max(heights) - np.min(heights)
        measurement_times = (heights - np.min(heights)) / height_range * target_duration
        
        # Interpolate amplitudes to regular time grid
        if len(amplitudes) < 2:
            # Fallback for insufficient data
            interpolated_amplitudes = np.full(num_samples, np.mean(amplitudes))
        else:
            interp_func = interpolate.interp1d(measurement_times, amplitudes, 
                                             kind='linear', bounds_error=False, 
                                             fill_value='extrapolate')
            interpolated_amplitudes = interp_func(target_times)
        
        # Convert amplitudes to audio waveform (simple approach)
        # Generate sine wave modulated by amplitude
        base_freq = 440.0  # Hz
        audio_signal = interpolated_amplitudes * np.sin(2 * np.pi * base_freq * target_times)
        
        # Add some harmonic content based on amplitude variations
        for harmonic in [2, 3, 4]:
            harmonic_amp = interpolated_amplitudes * (0.3 / harmonic)
            audio_signal += harmonic_amp * np.sin(2 * np.pi * base_freq * harmonic * target_times)
        
        # Normalize to prevent clipping
        if np.max(np.abs(audio_signal)) > 0:
            audio_signal = audio_signal / np.max(np.abs(audio_signal)) * 0.8
        
        return audio_signal, target_times
    
    def decode_mesh_to_audio(self, stl_filename, output_filename=None, duration=20):
        """Complete pipeline: scanned mesh -> reconstructed audio"""
        
        print("=== Helical Audio Decoder ===")
        
        # Step 1: Load scanned mesh
        mesh = self.load_scanned_mesh(stl_filename)
        
        # Step 2: Extract helical centerline
        try:
            centerline, heights = self.extract_helical_centerline(mesh)
        except ValueError as e:
            print(f"Error extracting centerline: {e}")
            print("Attempting alternative centerline extraction...")
            centerline, heights = self.extract_centerline_alternative(mesh)
        
        # Step 3: Measure thickness along helix
        thickness, angles, heights = self.measure_thickness_along_helix(mesh, centerline)
        
        # Step 4: Reconstruct temporal sequence
        amplitudes, sorted_heights = self.reconstruct_temporal_sequence(
            thickness, angles, heights)
        
        # Step 5: Interpolate to audio rate
        audio_signal, times = self.interpolate_to_audio_rate(
            amplitudes, sorted_heights, duration)
        
        # Step 6: Save reconstructed audio
        if output_filename is None:
            output_filename = stl_filename.replace('.stl', '_decoded.wav')
        
        # Save as WAV file
        try:
            import soundfile as sf
            sf.write(output_filename, audio_signal, self.sample_rate)
            print(f"Reconstructed audio saved as: {output_filename}")
        except ImportError:
            # Fallback to scipy
            from scipy.io import wavfile
            # Scale to 16-bit range
            audio_16bit = (audio_signal * 32767).astype(np.int16)
            wavfile.write(output_filename, self.sample_rate, audio_16bit)
            print(f"Reconstructed audio saved as: {output_filename}")
        
        # Return data for analysis
        return {
            'audio_signal': audio_signal,
            'amplitudes': amplitudes, 
            'thickness_measurements': thickness,
            'centerline': centerline,
            'reconstruction_success': True
        }
    
    def extract_centerline_alternative(self, mesh):
        """Alternative centerline extraction using mesh analysis"""
        vertices = mesh.vertices
        
        # Use DBSCAN clustering to find dense regions at different heights
        x, y, z = vertices[:, 0], vertices[:, 1], vertices[:, 2]
        
        # Create height slices and find cluster centers
        z_min, z_max = np.min(z), np.max(z)
        num_slices = max(20, int((z_max - z_min) / 2.0))  # 2mm slices minimum
        
        centerline_points = []
        heights = []
        
        for i in range(num_slices):
            slice_z = z_min + i * (z_max - z_min) / (num_slices - 1)
            
            # Get vertices in this slice
            height_mask = np.abs(z - slice_z) < 2.0
            if not np.any(height_mask):
                continue
                
            slice_vertices = vertices[height_mask][:, :2]  # x,y only
            
            if len(slice_vertices) < 5:
                continue
                
            # Use DBSCAN to find clusters
            try:
                clustering = DBSCAN(eps=3.0, min_samples=3).fit(slice_vertices)
                labels = clustering.labels_
                
                # Find the cluster closest to expected helix center
                unique_labels = set(labels)
                if -1 in unique_labels:
                    unique_labels.remove(-1)  # Remove noise points
                
                if unique_labels:
                    best_center = None
                    min_distance_to_origin = float('inf')
                    
                    for label in unique_labels:
                        cluster_points = slice_vertices[labels == label]
                        cluster_center = np.mean(cluster_points, axis=0)
                        
                        # Distance from origin (where we expect helix center)
                        dist_to_origin = np.sqrt(cluster_center[0]**2 + cluster_center[1]**2)
                        
                        if abs(dist_to_origin - self.base_radius) < min_distance_to_origin:
                            min_distance_to_origin = abs(dist_to_origin - self.base_radius)
                            best_center = cluster_center
                    
                    if best_center is not None:
                        centerline_points.append([best_center[0], best_center[1], slice_z])
                        heights.append(slice_z)
                        
            except Exception as e:
                print(f"Clustering failed at height {slice_z}: {e}")
                continue
        
        if len(centerline_points) < 5:
            raise ValueError("Alternative centerline extraction also failed")
            
        return np.array(centerline_points), np.array(heights)
    
    def visualize_reconstruction(self, mesh, centerline, thickness_measurements):
        """Create visualization of the reconstruction process"""
        fig = plt.figure(figsize=(15, 5))
        
        # 3D plot of mesh and centerline
        ax1 = fig.add_subplot(131, projection='3d')
        vertices = mesh.vertices
        ax1.scatter(vertices[::100, 0], vertices[::100, 1], vertices[::100, 2], 
                   c='lightgray', s=1, alpha=0.3, label='Scanned mesh')
        ax1.plot(centerline[:, 0], centerline[:, 1], centerline[:, 2], 
                'r-', linewidth=3, label='Extracted centerline')
        ax1.set_xlabel('X (mm)')
        ax1.set_ylabel('Y (mm)') 
        ax1.set_zlabel('Z (mm)')
        ax1.legend()
        ax1.set_title('Mesh + Centerline')
        
        # Thickness measurements along helix
        ax2 = fig.add_subplot(132)
        ax2.plot(thickness_measurements, 'b-', linewidth=2)
        ax2.axhline(y=self.min_thickness, color='r', linestyle='--', alpha=0.7, label='Min thickness')
        ax2.axhline(y=self.max_thickness, color='r', linestyle='--', alpha=0.7, label='Max thickness')
        ax2.set_xlabel('Measurement point')
        ax2.set_ylabel('Thickness (mm)')
        ax2.set_title('Measured Thickness')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Reconstructed amplitude
        amplitudes = (thickness_measurements - self.min_thickness) / (self.max_thickness - self.min_thickness)
        ax3 = fig.add_subplot(133)
        ax3.plot(amplitudes, 'g-', linewidth=2)
        ax3.set_xlabel('Time point')
        ax3.set_ylabel('Amplitude')
        ax3.set_title('Reconstructed Audio Amplitude')
        ax3.set_ylim(0, 1)
        ax3.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
        
        return fig

# Usage example and testing
if __name__ == "__main__":
    decoder = HelicalAudioDecoder()
    
    # Test with a scanned STL file
    try:
        result = decoder.decode_mesh_to_audio("scanned_helix.stl", "reconstructed_audio.wav")
        
        if result['reconstruction_success']:
            print("\n=== Reconstruction Summary ===")
            print(f"Extracted {len(result['centerline'])} centerline points")
            print(f"Made {len(result['thickness_measurements'])} thickness measurements")
            print(f"Audio amplitude range: {np.min(result['amplitudes']):.3f} - {np.max(result['amplitudes']):.3f}")
            
            # Optional: Create visualization
            # decoder.visualize_reconstruction(mesh, result['centerline'], result['thickness_measurements'])
            
    except FileNotFoundError:
        print("STL file not found. Make sure to scan your helical sculpture first!")
        print("\nTo use this decoder:")
        print("1. 3D print a helical sculpture using the encoder")
        print("2. 3D scan the printed object to get an STL file") 
        print("3. Run: decoder.decode_mesh_to_audio('your_scan.stl')")