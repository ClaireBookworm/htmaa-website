# Week 2

Making parametric design and vinyl cutting

## Vinyl Cutting

I learned to do vinyl cutting using the [open source tool](https://modsproject.org/) developed by Neil and the Media Lab on the Roland Vinyl Cutter.

<img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/cd1806172372d2d020e1605aecf1d91ed36edfcc_img_3901.jpg" alt="MIT Vinyl Sticker" style="height: 150px; width: auto;">

I've also been playing around a lot on Fusion360. I initially tried using FreeCAD but after struggling around with it for ~3+ hours, I decided to stick with Fusion, since I've used it before and I find the sketch to 3d workflow much more intuitive. 

I'm going to try to make this design I made in Figma (for my favorite band) on the Vinyl cutter: 

<img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/a2ec427cd76fd1f30cdba3bf698c05cac4bc3fde_bleachersticker.png" alt="bleachers sticker" style="height: 150px; width: auto;">

Here's a photo of the modproject interface when I put in a doodle of a pikachu batman: 

![ModProject](https://hc-cdn.hel1.your-objectstorage.com/s/v3/209523302a2ae9b5b1fa74ac1af0a0960c0492a0_img_4014.jpg). 

This is inspired by my consistent profile photo:

<img src="files/batemon.png" alt="Batemon" style="height: 150px; width: auto;">

Final product (ignore the background, I stuck it on my notebook that had a photo of snoopy in a batsuit): 

<img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/716a45097d64ea670aa0b33ed08ddbc4c8583df8_img_4015.jpg" alt="Batemon Sticker" style="height: 150px; width: auto;">

## Laser Cutting 

Things that we figured out about the Laser Cutter in the EECS makerspace is that the kerf is about 0.0049 inches, and the clearance is about -0.0045 inches, meaning that we should design for an interference fit.

**hardware setup:**

- 75w co2 laser (large machine)
    - generates infrared light that gets focused to a tiny point. when this concentrated energy hits material, it instantly heads and vaporizes it along the programmed path.
    - what “kerf” means (which is 0.0049’’ average) is the width of material that gets completely removed by the beam
- 60w co2 laser (small machine)
- universal laser systems hardware
- universal control software for parameter control
- inkscape for vector design and job sending

**design process**

1. design vectors → red lines w/ 0.001’’ weight is full cuts and blue lines (0.001’’ weight) is engraving/scoring
2. focus the bean using the focusing stick until it just touches material surface
3. set parameters: 100% power, 30% speed baseline, 500 ppi
4. ctrl+p to send job to universal control software
5. turn on air compressor, hit green button

Things to remember!

- focus accuracy determines cut quality—we use the white part of focusing stick
- kerf compensation is needed in design (if very precise)
- material thickness affects join clearance (-0.0045’’ interference fit on cardboard)
- the bed moves during focusing, laser tracks the material plane

Here's the final produce of the various building blocks I made:

![Combination](https://hc-cdn.hel1.your-objectstorage.com/s/v3/4cdcb069f4acd0bdffbc4b053af7f67fb23a911c_img_4024.jpg)

I also made an engraving cut of an album I love, called Gone Now by Bleachers. It came out relatively okay on cardboard, even though some teaching with the strength of hte cuts and using a different material will probably make it come out better: 

![Gone Now](https://hc-cdn.hel1.your-objectstorage.com/s/v3/29d4bdd5b4f7b3180b5c5160642421e627ebe57c_img_4020.jpg)

## CAD

I watched this [video](https://www.youtube.com/watch?v=r5kpEqka7Og) on making a wheel and made this:

![Wheel](https://hc-cdn.hel1.your-objectstorage.com/s/v3/df0f68e8120ca2d5a0c639310a41256c95fc96c6_screenshot_2025-09-18_at_9.59.18___pm.png)

I also tried to make a CAD of my ring, but it is not very perfect, so maybe I'll try to learn how to do this more professionally: 

<div style="display: flex; gap: 16px; justify-content: flex-start; align-items: flex-start;">
	<img src="files/week2/fusion_ring.png" alt="Ring" style="height: 180px; width: auto;">
	<img src="files/week2/fusion_cup.png" alt="Cup" style="height: 180px; width: auto;">
	<img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/9a026eeb0f26a974b3f4828775dd4229a3ad9927_screenshot_2025-09-19_at_9.33.56___pm.png" alt="image2" style="height: 180px; width: auto;">
</div>

Todos:
- [x] Vinyl cutting
- [ ] Builder kit w/ Laser Cutting!