from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import random
im=Image.open('1790278984532_tiny-dungeon.png').convert('RGBA')
def tile(i): return im.crop(((i%12)*16,(i//12)*16,(i%12)*16+16,(i//12)*16+16))
W,H=20,11
def scene(seed,props,tint,dark,wall=40,floor=(48,48,48,48,48,49,53),deco_wall=()):
    r=random.Random(seed)
    c=Image.new('RGBA',(W*16,H*16),(20,12,18,255))
    for y in range(H):
        for x in range(W):
            if y<4: t=tile(wall)
            else: t=tile(r.choice(floor))
            c.alpha_composite(t,(x*16,y*16))
    # wall base shadow line
    d=ImageDraw.Draw(c); d.rectangle([0,4*16-2,W*16,4*16+2],fill=(40,24,30,255))
    for x in (1,18):
        c.alpha_composite(tile(6),(x*16,2*16)); c.alpha_composite(tile(18),(x*16,3*16))
    for x,i in deco_wall: c.alpha_composite(tile(i),(x*16,2*16))
    for (x,y,i) in props: c.alpha_composite(tile(i),(x*16,y*16))
    # grade
    rgb=c.convert('RGB')
    ov=Image.new('RGB',rgb.size,tint); rgb=Image.blend(rgb,ov,0.22)
    rgb=ImageEnhance.Brightness(rgb).enhance(1-dark)
    # vignette
    v=Image.new('L',rgb.size,0); dv=ImageDraw.Draw(v)
    for k in range(40):
        dv.rectangle([k*3,k*1.6,rgb.width-k*3,rgb.height-k*1.6],fill=int(255*min(1,k/40)))
    black=Image.new('RGB',rgb.size,(8,4,10)); rgb=Image.composite(rgb,black,v)
    return rgb.resize((W*16*4,H*16*4),Image.NEAREST)
torch=29; win=28
S={
 'bg_f1':scene(1,[(2,5,82),(3,5,82),(16,5,72),(17,5,73),(9,9,42),(14,8,42)],'#ffb35a',0.05,deco_wall=[(4,win),(9,torch),(10,45-0),(15,torch)]),
 'bg_f2':scene(2,[(1,5,64),(3,5,65),(5,5,64),(14,5,65),(16,5,64),(18,5,65),(8,8,42)],'#7a8fc8',0.18,deco_wall=[(6,torch),(13,torch),(9,19),(10,19)]),
 'bg_f3':scene(3,[(2,5,42),(5,7,42),(15,5,82),(17,6,42),(12,9,42)],'#ff3b1f',0.12,deco_wall=[(3,torch),(9,20),(10,20),(16,torch)]),
 'bg_f4':scene(4,[(2,5,74),(4,5,74),(15,5,72),(16,5,73),(17,5,82),(9,9,42)],'#ff8a3d',0.1,deco_wall=[(5,8),(9,torch),(10,torch),(14,8)]),
 'bg_f5':scene(5,[(3,5,64),(16,5,64),(6,8,42),(13,8,42)],'#6a2fb0',0.2,deco_wall=[(2,torch),(6,torch),(13,torch),(17,torch)]),
}
for k,v in S.items(): v.save(f'out/{k}@big.png')
prev=Image.new('RGB',(1280*2+10,704*3//1+0),(0,0,0))
for i,(k,v) in enumerate(S.items()): prev.paste(v.resize((1280,704)),((i%2)*1290,(i//2)*704)) if i<6 else None
prev.resize((prev.width//3,prev.height//3)).save('bg_preview.png')
