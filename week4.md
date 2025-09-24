# week 4: 3d scanning and printing

Anisotropic - varying properties based on direction. For example, wood is stronger along the grain than across it. (Some printing material is like this when you build supports.)

Space between the print-head and the bed is very small and you should be careful. 

Concepts:
- Electroplating
- Stereolithography
- Binder Jetting 

The printer the EEECS makerspace has is the [Prusa Core One](https://www.prusa3d.com/product/prusa-core-one/), an enclosed corexy machine.

It has a 250x220x270mm build volume and can hit 600mm/s print speeds. It also has auto bed leveling, filament runout detection, and power panic recovery. Corexy means the print head moves via belts in an xy coordinate system rather than the bed moving, which is much faster and has less vibration. The enclosure helps with abs/petg temperature stability and reduces warping.

What is possible with this? Probably you can print much faster and a lot more materials become much more reliable. PVA

Types of 3d printing and support materials

- **PVA**: polyvinyl alcohol. Dissolves in water; you can print model in normal plastic and supports in pva + dunk in water
- **HIPS**: high impact polystyrene. It dissolves in limonen (citrus solvent), its much cheaper than PVA.
- **ABS** — what lego is made of, strong and heat resistance but shrinks as it cools so it warps and cracks without an enclosure. Acetone-weldable
- **asa** = basically outdoor abs, uv-stable. mostly the same properties but won't degrade in sunlight
- **pc** = polycarbonate, bulletproof glass material. It’s incredibly tough, heat resistant to ~140C, but needs ~300C nozzle temps
- **petg** = like pla's stronger cousin. easier to print than abs, stronger than pla, clear variants available. good middle ground
- **pla** = prints easy, biodegradable, but melts in a hot car.