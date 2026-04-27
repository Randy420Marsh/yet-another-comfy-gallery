#!/usr/bin/env python3
"""Generate beautiful abstract test images for the gallery."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
import os
import math
import random

OUTPUT_DIR = "images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH, HEIGHT = 1024, 768

def create_gradient_background(width, height, color1, color2, direction='vertical'):
    img = Image.new('RGB', (width, height))
    pixels = img.load()
    for y in range(height):
        ratio = y / height if direction == 'vertical' else (y % (height//2)) / (height//2)
        r = int(color1[0] + (color2[0] - color1[0]) * ratio)
        g = int(color1[1] + (color2[1] - color1[1]) * ratio)
        b = int(color1[2] + (color2[2] - color1[2]) * ratio)
        for x in range(width):
            pixels[x, y] = (r, g, b)
    return img

def generate_abstract_1():
    img = create_gradient_background(WIDTH, HEIGHT, (10, 5, 30), (40, 20, 80))
    draw = ImageDraw.Draw(img)
    random.seed(42)
    for _ in range(300):
        x, y = random.randint(0, WIDTH), random.randint(0, HEIGHT)
        size = random.choice([1,1,1,2,3])
        brightness = random.randint(180, 255)
        draw.ellipse([x, y, x+size, y+size], fill=(brightness, brightness, brightness))
    for i in range(5):
        cx, cy = random.randint(100, WIDTH-100), random.randint(100, HEIGHT-100)
        for _ in range(20):
            ox = cx + random.randint(-150, 150)
            oy = cy + random.randint(-100, 100)
            r = random.randint(40, 120)
            color = random.choice([(120, 60, 180), (60, 180, 200), (180, 80, 120)])
            draw.ellipse([ox-r, oy-r, ox+r, oy+r], fill=color)
    return img.filter(ImageFilter.GaussianBlur(radius=1))

def generate_abstract_2():
    img = create_gradient_background(WIDTH, HEIGHT, (20, 30, 50), (5, 15, 35))
    draw = ImageDraw.Draw(img)
    random.seed(123)
    cx, cy = WIDTH//2, HEIGHT//2
    points = []
    for i in range(8):
        angle = i * math.pi / 4
        r = 280 + random.randint(-30, 30)
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=(100, 200, 255, 180))
    for _ in range(12):
        x = random.randint(100, WIDTH-100)
        y = random.randint(100, HEIGHT-100)
        size = random.randint(40, 90)
        color = random.choice([(255, 100, 150), (100, 255, 200), (200, 150, 255)])
        pts = [(x + size*math.cos(a), y + size*math.sin(a)) for a in [i*math.pi/3 for i in range(6)]]
        draw.polygon(pts, fill=color)
    for _ in range(25):
        x1, y1 = random.randint(0,WIDTH), random.randint(0,HEIGHT)
        x2, y2 = x1 + random.randint(-200,200), y1 + random.randint(-200,200)
        draw.line([(x1,y1),(x2,y2)], fill=(200, 220, 255), width=2)
    return img.filter(ImageFilter.GaussianBlur(radius=0.5))

def generate_abstract_3():
    img = create_gradient_background(WIDTH, HEIGHT, (255, 120, 50), (30, 10, 60), 'vertical')
    draw = ImageDraw.Draw(img)
    random.seed(99)
    for layer in range(8):
        points = [(0, HEIGHT)]
        y_base = HEIGHT - layer * 70 - 50
        for x in range(0, WIDTH+50, 40):
            y = y_base + math.sin(x/60 + layer) * 35 + random.randint(-10,10)
            points.append((x, y))
        points.append((WIDTH, HEIGHT))
        color = (255 - layer*15, 80 + layer*10, 40 + layer*5)
        draw.polygon(points, fill=color)
    sun_x, sun_y = WIDTH//2, HEIGHT//3
    for r in range(120, 20, -5):
        draw.ellipse([sun_x-r, sun_y-r, sun_x+r, sun_y+r], fill=(255, 220, 100))
    return img

def generate_abstract_4():
    img = Image.new('RGB', (WIDTH, HEIGHT), (5, 5, 15))
    draw = ImageDraw.Draw(img)
    for x in range(0, WIDTH, 60):
        draw.line([(x, 0), (x, HEIGHT)], fill=(30, 60, 120), width=1)
    for y in range(0, HEIGHT, 60):
        draw.line([(0, y), (WIDTH, y)], fill=(30, 60, 120), width=1)
    random.seed(2024)
    for _ in range(35):
        x = random.randint(20, WIDTH-80)
        w = random.randint(30, 70)
        h = random.randint(150, 500)
        y = HEIGHT - h - random.randint(0, 50)
        color = random.choice([(20,40,80), (40,20,70), (10,60,50)])
        draw.rectangle([x, y, x+w, HEIGHT], fill=color)
        for wy in range(y+10, HEIGHT-10, 25):
            for wx in range(x+5, x+w-5, 18):
                if random.random() > 0.4:
                    draw.rectangle([wx, wy, wx+8, wy+12], fill=(255, 255, 180))
    for _ in range(8):
        x = random.randint(50, WIDTH-50)
        y = random.randint(100, HEIGHT-200)
        draw.rectangle([x-40, y-8, x+40, y+8], fill=(255, 30, 150))
        draw.rectangle([x-30, y-20, x+30, y-5], fill=(50, 200, 255))
    return img

def generate_abstract_5():
    img = create_gradient_background(WIDTH, HEIGHT, (15, 40, 35), (5, 20, 25))
    draw = ImageDraw.Draw(img)
    random.seed(777)
    for _ in range(25):
        cx = random.randint(50, WIDTH-50)
        cy = random.randint(50, HEIGHT-50)
        r = random.randint(30, 120)
        color = random.choice([(40, 180, 140), (80, 220, 180), (30, 140, 160)])
        for i in range(5):
            ox = cx + random.randint(-20,20)
            oy = cy + random.randint(-20,20)
            draw.ellipse([ox-r+i*3, oy-r+i*3, ox+r-i*3, oy+r-i*3], fill=color)
    for _ in range(40):
        x1 = random.randint(0, WIDTH)
        y1 = random.randint(0, HEIGHT)
        x2 = x1 + random.randint(-180, 180)
        y2 = y1 + random.randint(-180, 180)
        draw.line([(x1,y1), (x2,y2)], fill=(60, 200, 150), width=random.randint(1,4))
    return img.filter(ImageFilter.GaussianBlur(radius=2))

def generate_abstract_6():
    img = create_gradient_background(WIDTH, HEIGHT, (135, 180, 220), (20, 30, 60))
    draw = ImageDraw.Draw(img)
    random.seed(555)
    points = [(0, HEIGHT//2 + 80)]
    for x in range(0, WIDTH+60, 60):
        h = 180 + math.sin(x/90) * 120 + random.randint(-30,30)
        points.append((x, HEIGHT//2 + 80 - h))
    points.append((WIDTH, HEIGHT//2 + 80))
    draw.polygon(points, fill=(40, 70, 100))
    points2 = [(0, HEIGHT//2 + 150)]
    for x in range(0, WIDTH+40, 40):
        h = 280 + math.sin(x/70 + 1) * 90 + random.randint(-20,20)
        points2.append((x, HEIGHT//2 + 150 - h))
    points2.append((WIDTH, HEIGHT//2 + 150))
    draw.polygon(points2, fill=(25, 50, 75))
    for i in range(5):
        x = 150 + i * 160
        draw.polygon([(x-30, HEIGHT//2 - 50), (x, HEIGHT//2 - 120), (x+30, HEIGHT//2 - 50)], fill=(220, 230, 245))
    draw.rectangle([0, HEIGHT//2 + 160, WIDTH, HEIGHT], fill=(30, 60, 90))
    for y in range(HEIGHT//2 + 170, HEIGHT, 8):
        draw.line([(0, y), (WIDTH, y)], fill=(80, 140, 180))
    return img

images = [
    ("abstract-1.png", generate_abstract_1, "Nebula Dreams"),
    ("abstract-2.png", generate_abstract_2, "Crystal Matrix"),
    ("abstract-3.png", generate_abstract_3, "Ember Horizon"),
    ("abstract-4.png", generate_abstract_4, "Neon Sprawl"),
    ("abstract-5.png", generate_abstract_5, "Biotic Flow"),
    ("abstract-6.png", generate_abstract_6, "Silent Peaks"),
]

for filename, generator, title in images:
    print(f"Generating {filename} - {title}...")
    img = generator()
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except:
        font = ImageFont.load_default()
    draw.rectangle([0, HEIGHT-60, WIDTH, HEIGHT], fill=(0,0,0,128))
    draw.text((WIDTH//2, HEIGHT-35), title, fill=(255,255,255,200), font=font, anchor="mm")
    img.save(os.path.join(OUTPUT_DIR, filename), "PNG", optimize=True)
    print(f"  Saved {filename}")

print("\n✅ All 6 test images generated successfully in ./images/")