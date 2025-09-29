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
        """Measure cross-sectional thickness and frequency content at points along the helix"""
        vertices = mesh.vertices
        thickness_measurements = []
        frequency_profiles = []
        cross_section_shapes = []  # NEW: Store full cross-section data
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
                thickness_measurements.append(self.min_thickness)
                frequency_profiles.append([0.5, 0.5, 0.5])
                cross_section_shapes.append([])
                continue
                
            nearby_vertices = vertices[nearby_mask]
            
            # Calculate distances from centerline to nearby vertices
            radial_distances = []
            angular_positions = []
            z_offsets = []  # NEW: Track Z variations for 3D cross-section analysis
            
            for vertex in nearby_vertices:
                vx, vy, vz = vertex
                
                # Distance from centerline point to vertex (ignoring z for thickness)
                radial_dist = np.sqrt((vx - cx)**2 + (vy - cy)**2)
                radial_distances.append(radial_dist)
                
                # Calculate angular position relative to helix center
                vertex_angle = np.arctan2(vy - cy, vx - cx)
                angular_positions.append(vertex_angle)
                
                # NEW: Z offset from expected helix height
                expected_z = cz  # Should be at helix centerline height
                z_offsets.append(vz - expected_z)
            
            if radial_distances:
                # ENHANCED: Extract multiple thickness measurements
                thickness_data = self._extract_thickness_variations(radial_distances, angular_positions, z_offsets)
                thickness_measurements.append(thickness_data['avg_thickness'])
                
                # ENHANCED: Extract detailed frequency profile from cross-section
                freq_profile = self._analyze_3d_cross_section(radial_distances, angular_positions, z_offsets)
                frequency_profiles.append(freq_profile)
                
                # Store full cross-section shape for advanced analysis
                cross_section_shapes.append({
                    'radii': radial_distances,
                    'angles': angular_positions,
                    'z_offsets': z_offsets,
                    'thickness_variations': thickness_data['variations']
                })
                
                # Calculate angle for time reconstruction
                angle = np.arctan2(cy, cx)
                if angle < 0:
                    angle += 2 * np.pi
                    
                angles.append(angle)
                heights.append(cz)
            else:
                thickness_measurements.append(self.min_thickness)
                frequency_profiles.append([0.5, 0.5, 0.5])
                cross_section_shapes.append([])
                angles.append(0)
                heights.append(cz)
        
        return np.array(thickness_measurements), np.array(frequency_profiles), np.array(angles), np.array(heights), cross_section_shapes
    
    def _extract_thickness_variations(self, radial_distances, angular_positions, z_offsets):
        """Extract detailed thickness variations from cross-section"""
        if len(radial_distances) < 3:
            return {'avg_thickness': self.min_thickness, 'variations': []}
        
        # Sort by angular position to get ordered cross-section
        sorted_indices = np.argsort(angular_positions)
        sorted_radii = np.array(radial_distances)[sorted_indices]
        sorted_z_offsets = np.array(z_offsets)[sorted_indices]
        
        # Calculate average thickness
        avg_thickness = np.mean(sorted_radii)
        
        # Calculate thickness variations (this encodes frequency content!)
        thickness_variations = []
        for i in range(len(sorted_radii)):
            # Local thickness variation
            local_thickness = sorted_radii[i]
            # Z variation (encodes different frequency bands)
            z_variation = abs(sorted_z_offsets[i]) if i < len(sorted_z_offsets) else 0
            
            thickness_variations.append({
                'thickness': local_thickness,
                'z_variation': z_variation,
                'angle': angular_positions[sorted_indices[i]]
            })
        
        return {
            'avg_thickness': avg_thickness,
            'variations': thickness_variations
        }
    
    def _analyze_3d_cross_section(self, radial_distances, angular_positions, z_offsets):
        """Analyze 3D cross-section to extract detailed frequency content"""
        if len(radial_distances) < 3:
            return [0.5, 0.5, 0.5]
        
        # Sort by angular position to get ordered cross-section
        sorted_indices = np.argsort(angular_positions)
        sorted_radii = np.array(radial_distances)[sorted_indices]
        sorted_z_offsets = np.array(z_offsets)[sorted_indices]
        
        # Normalize radii to 0-1 range
        if np.max(sorted_radii) > np.min(sorted_radii):
            normalized_radii = (sorted_radii - np.min(sorted_radii)) / (np.max(sorted_radii) - np.min(sorted_radii))
        else:
            normalized_radii = np.full_like(sorted_radii, 0.5)
        
        # ENHANCED: Extract frequency characteristics from 3D cross-section shape
        # Bass: overall thickness variation and Z stability (low frequency)
        bass_content = np.std(normalized_radii) * (1.0 - np.std(sorted_z_offsets))  # Thick + stable = bass
        
        # Mids: intermediate frequency content (shape complexity + moderate Z variation)
        if len(normalized_radii) > 4:
            # Use FFT-like analysis on the cross-section
            fft_result = np.fft.fft(normalized_radii)
            mid_freqs = fft_result[1:len(fft_result)//3]  # middle frequency range
            mids_content = np.mean(np.abs(mid_freqs)) * (0.5 + np.std(sorted_z_offsets))
        else:
            mids_content = 0.5
        
        # Treble: high frequency content (surface roughness + high Z variation)
        if len(normalized_radii) > 2:
            # Calculate local variations (high frequency)
            diffs = np.diff(normalized_radii)
            treble_content = np.mean(np.abs(diffs)) * (1.0 + np.std(sorted_z_offsets))
        else:
            treble_content = 0.5
        
        # Normalize to 0-1 range
        return [
            min(1.0, max(0.0, bass_content)),
            min(1.0, max(0.0, mids_content)), 
            min(1.0, max(0.0, treble_content))
        ]
    
    def _analyze_cross_section_frequencies(self, radial_distances, angular_positions):
        """Analyze cross-section shape to extract frequency content"""
        if len(radial_distances) < 3:
            return [0.5, 0.5, 0.5]  # neutral profile
        
        # Sort by angular position to get ordered cross-section
        sorted_indices = np.argsort(angular_positions)
        sorted_radii = np.array(radial_distances)[sorted_indices]
        
        # Normalize radii to 0-1 range
        if np.max(sorted_radii) > np.min(sorted_radii):
            normalized_radii = (sorted_radii - np.min(sorted_radii)) / (np.max(sorted_radii) - np.min(sorted_radii))
        else:
            normalized_radii = np.full_like(sorted_radii, 0.5)
        
        # Extract frequency characteristics from cross-section shape
        # Bass: overall thickness variation (low frequency)
        bass_content = np.std(normalized_radii)  # variation in thickness
        
        # Mids: intermediate frequency content (shape complexity)
        if len(normalized_radii) > 4:
            # Use FFT-like analysis on the cross-section
            fft_result = np.fft.fft(normalized_radii)
            mid_freqs = fft_result[1:len(fft_result)//3]  # middle frequency range
            mids_content = np.mean(np.abs(mid_freqs))
        else:
            mids_content = 0.5
        
        # Treble: high frequency content (surface roughness)
        if len(normalized_radii) > 2:
            # Calculate local variations (high frequency)
            diffs = np.diff(normalized_radii)
            treble_content = np.mean(np.abs(diffs))
        else:
            treble_content = 0.5
        
        # Normalize to 0-1 range
        return [
            min(1.0, max(0.0, bass_content)),
            min(1.0, max(0.0, mids_content)), 
            min(1.0, max(0.0, treble_content))
        ]
    
    def reconstruct_temporal_sequence(self, thickness_measurements, frequency_profiles, angles, heights, cross_section_shapes):
        """Convert helical measurements back to temporal audio sequence with frequency content"""
        
        # Calculate time parameter from height (since helix grows vertically with time)
        # Each revolution = 2π radians = pitch mm of height
        total_rotations = (np.max(heights) - np.min(heights)) / self.pitch
        
        print(f"Detected {total_rotations:.1f} rotations in helix")
        
        # Sort measurements by height (time progression)
        sort_indices = np.argsort(heights)
        sorted_thickness = thickness_measurements[sort_indices]
        sorted_freq_profiles = frequency_profiles[sort_indices]
        sorted_heights = heights[sort_indices]
        sorted_angles = angles[sort_indices]
        sorted_cross_sections = [cross_section_shapes[i] for i in sort_indices]
        
        # ENHANCED: Convert thickness back to amplitude with cross-section analysis
        # thickness = min_thickness + amplitude * (max_thickness - min_thickness)
        amplitude_range = self.max_thickness - self.min_thickness
        amplitudes = (sorted_thickness - self.min_thickness) / amplitude_range
        amplitudes = np.clip(amplitudes, 0.0, 1.0)  # ensure valid range
        
        # ENHANCED: Extract additional audio features from cross-section shapes
        enhanced_freq_profiles = []
        for i, cross_section in enumerate(sorted_cross_sections):
            if cross_section and 'thickness_variations' in cross_section:
                # Extract more detailed frequency information from cross-section
                enhanced_profile = self._extract_enhanced_frequency_content(
                    cross_section, sorted_freq_profiles[i]
                )
                enhanced_freq_profiles.append(enhanced_profile)
            else:
                enhanced_freq_profiles.append(sorted_freq_profiles[i])
        
        print(f"Reconstructed {len(amplitudes)} amplitude measurements")
        print(f"Amplitude range: {np.min(amplitudes):.3f} to {np.max(amplitudes):.3f}")
        print(f"Enhanced frequency profiles extracted with cross-section analysis")
        
        return amplitudes, enhanced_freq_profiles, sorted_heights
    
    def _extract_enhanced_frequency_content(self, cross_section, base_profile):
        """Extract enhanced frequency content from detailed cross-section data"""
        if not cross_section or 'thickness_variations' not in cross_section:
            return base_profile
        
        variations = cross_section['thickness_variations']
        if not variations:
            return base_profile
        
        # Extract thickness variations (encodes frequency content)
        thicknesses = [v['thickness'] for v in variations]
        z_variations = [v['z_variation'] for v in variations]
        
        # ENHANCED: More sophisticated frequency analysis
        # Bass: thick, stable cross-sections
        bass_enhancement = np.mean(thicknesses) * (1.0 - np.std(z_variations))
        
        # Mids: moderate thickness variation with some Z variation
        mids_enhancement = np.std(thicknesses) * (0.5 + np.mean(z_variations))
        
        # Treble: high thickness variation and high Z variation
        treble_enhancement = np.std(thicknesses) * (1.0 + np.std(z_variations))
        
        # Combine with base profile
        enhanced_profile = [
            min(1.0, max(0.0, base_profile[0] * 0.7 + bass_enhancement * 0.3)),
            min(1.0, max(0.0, base_profile[1] * 0.7 + mids_enhancement * 0.3)),
            min(1.0, max(0.0, base_profile[2] * 0.7 + treble_enhancement * 0.3))
        ]
        
        return enhanced_profile
    
    def interpolate_to_audio_rate(self, amplitudes, frequency_profiles, heights, target_duration=20):
        """Interpolate measured amplitudes and frequency content to audio sample rate"""
        
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
            interpolated_bass = np.full(num_samples, 0.5)
            interpolated_mids = np.full(num_samples, 0.5)
            interpolated_treble = np.full(num_samples, 0.5)
        else:
            interp_func = interpolate.interp1d(measurement_times, amplitudes, 
                                             kind='linear', bounds_error=False, 
                                             fill_value='extrapolate')
            interpolated_amplitudes = interp_func(target_times)
            
            # Interpolate frequency profiles
            bass_content = [fp[0] for fp in frequency_profiles]
            mids_content = [fp[1] for fp in frequency_profiles]
            treble_content = [fp[2] for fp in frequency_profiles]
            
            interp_bass = interpolate.interp1d(measurement_times, bass_content, 
                                             kind='linear', bounds_error=False, 
                                             fill_value='extrapolate')
            interp_mids = interpolate.interp1d(measurement_times, mids_content, 
                                             kind='linear', bounds_error=False, 
                                             fill_value='extrapolate')
            interp_treble = interpolate.interp1d(measurement_times, treble_content, 
                                               kind='linear', bounds_error=False, 
                                               fill_value='extrapolate')
            
            interpolated_bass = interp_bass(target_times)
            interpolated_mids = interp_mids(target_times)
            interpolated_treble = interp_treble(target_times)
        
        # ENHANCED: Generate musical audio signal with melody and harmony
        audio_signal = np.zeros(num_samples)
        
        # Extract melody from thickness variations (main frequency content)
        melody_freqs = self._extract_melody_frequencies(interpolated_amplitudes, interpolated_bass, interpolated_mids, interpolated_treble)
        
        # Generate main melody line
        melody_signal = np.zeros(num_samples)
        for i, (freq, amp) in enumerate(melody_freqs):
            if freq > 0 and amp > 0.1:  # Only play significant notes
                # Calculate note duration and timing
                note_duration = num_samples // len(melody_freqs)
                start_sample = i * note_duration
                end_sample = min(start_sample + note_duration, num_samples)
                
                if start_sample < num_samples:
                    # Create note envelope (attack, sustain, decay)
                    note_samples = end_sample - start_sample
                    attack_samples = note_samples // 10
                    decay_samples = note_samples // 5
                    
                    note_times = np.arange(note_samples) / self.sample_rate
                    
                    # Create envelope
                    envelope = np.ones(note_samples)
                    if attack_samples > 0:
                        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
                    if decay_samples > 0:
                        envelope[-decay_samples:] = np.linspace(1, 0, decay_samples)
                    
                    # Add slight vibrato
                    vibrato = 1.0 + 0.01 * np.sin(2 * np.pi * 5.0 * note_times)
                    
                    # Generate note
                    note_signal = amp * envelope * np.sin(2 * np.pi * freq * vibrato * note_times)
                    melody_signal[start_sample:end_sample] += note_signal
        
        # Generate harmonic accompaniment
        harmony_signal = np.zeros(num_samples)
        for i, (freq, amp) in enumerate(melody_freqs):
            if freq > 0 and amp > 0.1:
                # Calculate note timing (same as melody)
                note_duration = num_samples // len(melody_freqs)
                start_sample = i * note_duration
                end_sample = min(start_sample + note_duration, num_samples)
                
                if start_sample < num_samples:
                    # Add harmonic frequencies (3rd, 5th, octave)
                    harmonics = [freq * 1.25, freq * 1.5, freq * 2.0]  # Major 3rd, Perfect 5th, Octave
                    for harmonic_freq in harmonics:
                        if harmonic_freq < 8000:  # Keep in audible range
                            harmonic_amp = amp * 0.2  # Softer harmonics
                            
                            # Create note envelope (same as melody)
                            note_samples = end_sample - start_sample
                            attack_samples = note_samples // 10
                            decay_samples = note_samples // 5
                            
                            note_times = np.arange(note_samples) / self.sample_rate
                            
                            envelope = np.ones(note_samples)
                            if attack_samples > 0:
                                envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
                            if decay_samples > 0:
                                envelope[-decay_samples:] = np.linspace(1, 0, decay_samples)
                            
                            # Generate harmonic note
                            harmonic_signal = harmonic_amp * envelope * np.sin(2 * np.pi * harmonic_freq * note_times)
                            harmony_signal[start_sample:end_sample] += harmonic_signal
        
        # Generate bass line from bass content (more stable)
        bass_signal = np.zeros(num_samples)
        bass_freqs = [80, 120, 160, 200]  # Bass frequencies
        for i, freq in enumerate(bass_freqs):
            # Use average bass content instead of interpolated
            avg_bass = np.mean(interpolated_bass)
            weight = avg_bass * (0.2 / len(bass_freqs))  # Reduced volume
            # Bass gets very slow modulation
            bass_mod = 1.0 + 0.02 * np.sin(2 * np.pi * 0.1 * target_times)
            bass_signal += weight * np.sin(2 * np.pi * freq * bass_mod * target_times)
        
        # Generate treble texture from treble content (more stable)
        treble_signal = np.zeros(num_samples)
        treble_freqs = [2500, 3500, 5000, 7000]
        for i, freq in enumerate(treble_freqs):
            # Use average treble content instead of interpolated
            avg_treble = np.mean(interpolated_treble)
            weight = avg_treble * (0.1 / len(treble_freqs))  # Reduced volume
            # Treble gets moderate modulation for texture
            treble_mod = 1.0 + 0.05 * np.sin(2 * np.pi * 1.0 * target_times)
            treble_signal += weight * np.sin(2 * np.pi * freq * treble_mod * target_times)
        
        # Add percussive elements based on amplitude changes
        percussive_signal = np.zeros(num_samples)
        amplitude_changes = np.abs(np.diff(interpolated_amplitudes, prepend=interpolated_amplitudes[0]))
        for i in range(0, num_samples, 100):  # Every 100 samples
            if amplitude_changes[i] > 0.1:  # Significant amplitude change
                # Add percussive click
                click_duration = 50  # samples
                click_end = min(i + click_duration, num_samples)
                percussive_signal[i:click_end] += 0.3 * np.exp(-np.arange(click_end - i) / 10.0) * np.sin(2 * np.pi * 1000 * np.arange(click_end - i) / self.sample_rate)
        
        # Combine all signals with reduced volumes
        audio_signal = (melody_signal * 0.3 + 
                       harmony_signal * 0.2 + 
                       bass_signal * 0.1 + 
                       treble_signal * 0.05 + 
                       percussive_signal * 0.05)
        
        # Add subtle reverb-like effect
        audio_signal = self._add_simple_reverb(audio_signal, self.sample_rate)
        
        # Apply dynamic compression
        audio_signal = self._apply_compression(audio_signal)
        
        # Normalize to prevent clipping and keep volume reasonable
        if np.max(np.abs(audio_signal)) > 0:
            audio_signal = audio_signal / np.max(np.abs(audio_signal)) * 0.5  # Reduced from 0.8 to 0.5
        
        print(f"Generated musical audio with melody, harmony, bass, treble, and percussive elements")
        print(f"Added reverb, compression, and musical scale mapping")
        
        return audio_signal, target_times
    
    def _generate_pink_noise(self, num_samples):
        """Generate pink noise (1/f noise) for more natural texture"""
        # Simple pink noise generation using filtering
        white_noise = np.random.normal(0, 1, num_samples)
        
        # Apply simple 1/f filter approximation
        # This is a simplified version - in practice you'd use more sophisticated filtering
        pink_noise = np.zeros(num_samples)
        b0, b1, b2, b3, b4, b5, b6 = 0.99886, 0.99332, 0.96900, 0.86650, 0.55000, -0.7616, -0.1900
        
        for i in range(num_samples):
            pink_noise[i] = (b0 * white_noise[i] + b1 * (white_noise[i-1] if i > 0 else 0) + 
                           b2 * (white_noise[i-2] if i > 1 else 0) + b3 * (white_noise[i-3] if i > 2 else 0) + 
                           b4 * (white_noise[i-4] if i > 3 else 0) + b5 * (white_noise[i-5] if i > 4 else 0) + 
                           b6 * (white_noise[i-6] if i > 5 else 0))
        
        return pink_noise
    
    def _extract_melody_frequencies(self, amplitudes, bass_content, mids_content, treble_content):
        """Extract melody frequencies from the helical data"""
        # Map amplitude and frequency content to musical frequencies
        melody_freqs = []
        
        # Create a stable musical scale (C major scale)
        base_freq = 261.63  # C4
        scale_ratios = [1.0, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875, 2.0]  # C, D, E, F, G, A, B, C
        
        # Sample the data at regular intervals to create melody
        num_notes = min(15, len(amplitudes) // 20)  # Fewer notes, more stable
        
        for i in range(num_notes):
            idx = int(i * len(amplitudes) / num_notes)
            if idx < len(amplitudes):
                # Map amplitude to note selection (but keep it stable)
                amp = amplitudes[idx]
                bass = bass_content[idx] if idx < len(bass_content) else 0.5
                mids = mids_content[idx] if idx < len(mids_content) else 0.5
                treble = treble_content[idx] if idx < len(treble_content) else 0.5
                
                # Choose note based on frequency content (but cycle through scale)
                if bass > 0.6:
                    note_ratio = scale_ratios[0]  # C (bass)
                elif mids > 0.6:
                    note_ratio = scale_ratios[2]  # E (mids)
                elif treble > 0.6:
                    note_ratio = scale_ratios[4]  # G (treble)
                else:
                    # Cycle through scale instead of mapping amplitude directly
                    scale_idx = i % len(scale_ratios)
                    note_ratio = scale_ratios[scale_idx]
                
                # Keep octave stable (no increasing pitch)
                octave = 1  # Always stay in same octave
                freq = base_freq * note_ratio * octave
                
                # Only add if amplitude is significant, but cap the amplitude
                if amp > 0.1:
                    # Cap amplitude to prevent getting too loud
                    capped_amp = min(amp, 0.8)
                    melody_freqs.append((freq, capped_amp))
        
        return melody_freqs
    
    def _add_simple_reverb(self, signal, sample_rate, reverb_time=0.3):
        """Add simple reverb effect"""
        reverb_samples = int(reverb_time * sample_rate)
        reverb_signal = np.zeros(len(signal) + reverb_samples)
        reverb_signal[:len(signal)] = signal
        
        # Simple reverb: delayed and attenuated copies
        for delay in [int(0.1 * sample_rate), int(0.2 * sample_rate), int(0.3 * sample_rate)]:
            if delay < len(signal):
                reverb_signal[delay:delay + len(signal)] += signal * 0.3
        
        return reverb_signal[:len(signal)]
    
    def _apply_compression(self, signal, threshold=0.5, ratio=4.0):
        """Apply simple dynamic compression"""
        compressed = np.copy(signal)
        
        # Apply compression to peaks above threshold
        above_threshold = np.abs(signal) > threshold
        compressed[above_threshold] = np.sign(signal[above_threshold]) * (
            threshold + (np.abs(signal[above_threshold]) - threshold) / ratio
        )
        
        return compressed
    
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
        
        # Step 3: Measure thickness and frequency content along helix
        thickness, frequency_profiles, angles, heights, cross_section_shapes = self.measure_thickness_along_helix(mesh, centerline)
        
        # Step 4: Reconstruct temporal sequence with enhanced frequency content
        amplitudes, sorted_freq_profiles, sorted_heights = self.reconstruct_temporal_sequence(
            thickness, frequency_profiles, angles, heights, cross_section_shapes)
        
        # Step 5: Interpolate to audio rate with enhanced frequency content
        audio_signal, times = self.interpolate_to_audio_rate(
            amplitudes, sorted_freq_profiles, sorted_heights, duration)
        
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
            'frequency_profiles': sorted_freq_profiles,
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
        result = decoder.decode_mesh_to_audio("scanned_chinatown.stl", "reconstructed_audio.wav")
        
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