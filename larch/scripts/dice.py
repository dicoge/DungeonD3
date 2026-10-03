from PIL import Image, ImageDraw, ImageFont
import math, random
N=96; SC=3
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
PAL={'normal':dict(face='#9b30d0',side1='#6a0dad',side2='#4a0880',edge='#e9c8ff',out='#1a0828',num='#ffffff',glow=(176,107,255)),
     'crit':dict(face='#f2c230',side1='#c08a1a',side2='#7a4a10',edge='#fff3b0',out='#2a1a04',num='#3f2631',glow=(255,215,90)),
     'fail':dict(face='#c0262a',side1='#7a1c1c',side2='#4a0e10',edge='#ffb0a8',out='#1a0406',num='#ffffff',glow=(255,70,60))}
def H(s): s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))
def die(num,pal='normal',ang=0.0,sx=1.0,sy=1.0,cx=48,cy=48,R=38,glow=True,numalpha=255):
    P=PAL[pal]
    im=Image.new('RGBA',(N,N),(0,0,0,0)); d=ImageDraw.Draw(im)
    def pt(a,r):
        x=math.cos(a+ang)*r; y=math.sin(a+ang)*r
        return (cx+x*sx, cy+y*sy)
    if glow:
        g=Image.new('RGBA',(N,N),(0,0,0,0)); gd=ImageDraw.Draw(g)
        for k in range(R+10,R-2,-2):
            a=int(90*(1-(k-(R-2))/12)); gd.ellipse([cx-k*sx,cy-k*sy,cx+k*sx,cy+k*sy],fill=P['glow']+(max(0,a),))
        im.alpha_composite(g)
    hexp=[pt(math.radians(-90+60*i),R) for i in range(6)]
    tri=[pt(math.radians(-90+120*i),R*0.62) for i in range(3)]
    tri=[pt(math.radians(90+120*i),R*0.62) for i in range(3)]  # pointing down? use up-pointing
    tri=[pt(math.radians(-90+120*i),R*0.58) for i in range(3)]
    d.polygon(hexp,fill=H(P['side2']),outline=H(P['out']))
    # side facets: connect each tri vertex with hex vertices
    for i in range(6):
        a=hexp[i]; b=hexp[(i+1)%6]
        t=tri[((i+1)//2)%3]
        d.polygon([a,b,t],fill=H(P['side1'] if i%2 else P['side2']),outline=H(P['edge']))
    d.polygon(tri,fill=H(P['face']),outline=H(P['edge']))
    d.polygon(hexp,outline=H(P['out']))
    if num is not None:
        s=str(num); fs=20 if len(s)==1 else 17
        f=ImageFont.truetype(FONT,fs)
        tw=d.textbbox((0,0),s,font=f)
        tx=cx-(tw[2]-tw[0])/2-tw[0]; ty=cy+3-(tw[3]-tw[1])/2-tw[1]
        t=Image.new('L',(N,N),0); ImageDraw.Draw(t).text((tx,ty),s,font=f,fill=255)
        t=t.point(lambda v:255 if v>110 else 0)
        sh=Image.new('RGBA',(N,N),H(P['out'])+(0,)); sh.putalpha(t.point(lambda v:min(v,numalpha)))
        im.alpha_composite(sh,(1,1))
        col=Image.new('RGBA',(N,N),H(P['num'])+(0,)); col.putalpha(t.point(lambda v:min(v,numalpha)))
        im.alpha_composite(col)
    return im
def big(im): return im.resize((N*SC,N*SC),Image.NEAREST)
for n in range(1,21):
    pal='crit' if n==20 else 'fail' if n==1 else 'normal'
    big(die(n,pal)).save(f'dice/face_{n:02d}.png')
# rolling animation
frames=[]; r=random.Random(3)
T=26
for i in range(T):
    t=i/T
    ang=t*math.pi*4
    sx=0.55+0.45*abs(math.cos(t*math.pi*5)); sy=0.75+0.25*abs(math.sin(t*math.pi*3))
    bounce=abs(math.sin(t*math.pi*3))*-10
    num=r.randint(1,20)
    fr=die(num,'normal',ang=ang,sx=sx,sy=sy,cy=52+bounce,R=34,numalpha=200)
    # sparkles
    dd=ImageDraw.Draw(fr)
    for k in range(4):
        x=r.randint(8,88); y=r.randint(8,88); c=(255,240,200,220) if k%2 else (233,200,255,220)
        dd.point([(x,y),(x+1,y),(x-1,y),(x,y+1),(x,y-1)],fill=c)
    frames.append(big(fr))
frames[0].save('dice/rolling.webp',save_all=True,append_images=frames[1:],duration=55,loop=0,lossless=True,disposal=2)
frames[0].save('dice/rolling.gif',save_all=True,append_images=frames[1:],duration=55,loop=0,disposal=2,transparency=0)
# preview sheet
sheet=Image.new('RGBA',(10*150,3*150),(30,20,40,255))
for n in range(1,21):
    sheet.alpha_composite(Image.open(f'dice/face_{n:02d}.png').resize((144,144)),(((n-1)%10)*150,((n-1)//10)*150))
for k in range(10): sheet.alpha_composite(frames[k*2].resize((144,144)),(k*150,300))
sheet.save('dice_preview.png')
# padded versions: dice sits in the upper part of a tall transparent canvas
def pad(img):
    c=Image.new('RGBA',(N*SC,int(N*SC*1.75)),(0,0,0,0)); c.alpha_composite(img,(0,0)); return c
for n in range(1,21):
    pad(Image.open(f'dice/face_{n:02d}.png')).save(f'dice/pface_{n:02d}.png')
pf=[pad(f) for f in frames]
pf[0].save('dice/prolling.webp',save_all=True,append_images=pf[1:],duration=55,loop=0,lossless=True,disposal=2)
