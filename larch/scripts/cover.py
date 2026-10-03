from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import random
im=Image.open('1790278984532_tiny-dungeon.png').convert('RGBA')
def tile(i): return im.crop(((i%12)*16,(i//12)*16,(i%12)*16+16,(i//12)*16+16))
W,H=20,12  # 320x192 -> crop to 320x180
r=random.Random(9)
c=Image.new('RGBA',(320,192),(12,6,16,255))
for y in range(H):
    for x in range(W):
        t=tile(40) if y<5 else tile(r.choice([48,48,48,49,53]))
        c.alpha_composite(t,(x*16,y*16))
for x in (2,6,13,17):
    c.alpha_composite(tile(6),(x*16,3*16)); c.alpha_composite(tile(18),(x*16,4*16))
for x in (4,15): c.alpha_composite(tile(29),(x*16,2*16))
for x in (9,10): c.alpha_composite(tile(19),(x*16,1*16))
for (x,y,i) in [(1,6,64),(3,6,65),(16,6,64),(18,6,65),(5,10,82),(14,10,72)]: c.alpha_composite(tile(i),(x*16,y*16))
lich=Image.open('out/lich_king.png').convert('RGBA').resize((64,64),Image.NEAREST)
hero=tile(98).resize((32,32),Image.NEAREST)
dice=Image.open('out/icon_dice.png').convert('RGBA').resize((32,32),Image.NEAREST)
# glow helpers
def glow(base,cx,cy,rad,col,alpha):
    g=Image.new('RGBA',base.size,(0,0,0,0)); d=ImageDraw.Draw(g)
    for k in range(rad,0,-2):
        a=int(alpha*(1-k/rad)**1.5); d.ellipse([cx-k,cy-k,cx+k,cy+k],fill=col+(a,))
    base.alpha_composite(g)
rgb=c.convert('RGB'); rgb=Image.blend(rgb,Image.new('RGB',rgb.size,(70,30,120)),0.3); rgb=ImageEnhance.Brightness(rgb).enhance(0.55)
c=rgb.convert('RGBA')
glow(c,160,70,70,(155,48,208),170)
c.alpha_composite(lich,(128,40))
glow(c,160,150,26,(255,200,120),120)
c.alpha_composite(hero,(144,128))
glow(c,214,128,22,(200,140,255),200)
c.alpha_composite(dice,(198,112))
# vignette
v=Image.new('L',c.size,0); dv=ImageDraw.Draw(v)
for k in range(40): dv.rectangle([k*3,k*2,c.width-k*3,c.height-k*2],fill=int(255*min(1,k/30)))
c=Image.composite(c,Image.new('RGBA',c.size,(6,2,10,255)),v)
c=c.crop((0,6,320,186)).resize((1280,720),Image.NEAREST)
c.convert('RGB').save('out/cover@big.png')
c.convert('RGB').resize((640,360)).save('cover_prev.png')
