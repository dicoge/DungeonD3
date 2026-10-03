from PIL import Image, ImageDraw
im=Image.open('1790278984532_tiny-dungeon.png').convert('RGBA')
def tile(i): return im.crop(((i%12)*16,(i//12)*16,(i%12)*16+16,(i//12)*16+16))
def spr(n): return Image.open(n).convert('RGBA')
def H(s): s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))
def recolor(t,m):
    t=t.copy(); px=t.load()
    mm={H(k):H(v) for k,v in m.items()}
    for y in range(t.height):
        for x in range(t.width):
            p=px[x,y]
            if p[3] and p[:3] in mm: px[x,y]=mm[p[:3]]+(p[3],)
    return t
def put(t,pts,col):
    t=t.copy(); px=t.load()
    for x,y in pts: px[x,y]=H(col)+(255,)
    return t
SK_BONE={'#f7c282':'#e8e4d4','#e19a65':'#c9c2ad','#bd6c4a':'#9a9384','#763b36':'#5d5850'}
ZOMB={'#f7c282':'#9fc77a','#e19a65':'#7ea35c','#bd6c4a':'#5a6e46','#763b36':'#3e4a33','#c0cbdc':'#7c6a5a','#8b9bb4':'#5c4c40'}
arts={}
arts['slime']=tile(108)
arts['goblin']=tile(112)
arts['bat']=tile(120)
arts['rat']=tile(123)
arts['spider']=tile(122)
arts['skeleton']=recolor(tile(86),{**SK_BONE,'#c0cbdc':'#8b9bb4'})
arts['ghost']=tile(121)
arts['zombie']=recolor(tile(85),ZOMB)
arts['goblin_elite']=recolor(tile(112),{'#25956a':'#d4a017','#43e1b3':'#ffe57a','#bd6c4a':'#6b8f3a','#e19a65':'#86a94a','#f7c282':'#a8c860'})
arts['skeleton_elite']=put(recolor(tile(86),{**SK_BONE,'#c0cbdc':'#b02a2a','#8b9bb4':'#7a1c1c','#262b44':'#ff3030'}),[],'#ff0000')
arts['orc']=recolor(tile(111),{'#bd6c4a':'#4f7a33','#e19a65':'#6c9a45','#f7c282':'#8bbf5a','#763b36':'#2f4a20'})
arts['troll']=recolor(tile(109),{'#f7c282':'#8fa3a8','#e19a65':'#6d8288','#bd6c4a':'#4f6064','#763b36':'#34403f','#ffffff':'#ffd84a'})
arts['imp']=tile(110)
arts['shadow_wraith_elite']=recolor(tile(121),{'#c0cbdc':'#5b3a8c','#8b9bb4':'#36205a','#3f2631':'#140a22'})
arts['golem']=recolor(tile(97),{'#8b9bb4':'#8a7a63','#c0cbdc':'#b3a284','#52607c':'#5a4d3c','#f7c282':'#ff9b3d','#e19a65':'#e0662a','#bd6c4a':'#5a4d3c','#262b44':'#ffcf5a'})
arts['demon']=recolor(tile(110),{'#e84537':'#7b2fa8','#ff706d':'#b05ad8','#f7c282':'#e9b9ff','#bd6c4a':'#4b1d6b'})
arts['dragon_minion']=spr('1790296727755_dragon-nightfall.png')
arts['lich_guardian']=recolor(tile(96),{'#8b9bb4':'#4a3a6b','#c0cbdc':'#7a62a8','#52607c':'#2a1f44','#bd6c4a':'#7df9ff'})
arts['gatekeeper']=recolor(spr('1790278935332_cyclops.png'),{})
# gatekeeper: darken whatever palette
g=arts['gatekeeper'].copy();px=g.load()
for y in range(g.height):
    for x in range(g.width):
        r,gg,b,a=px[x,y]
        if a and not (r<80 and gg<60 and b<70):
            l=(r+gg+b)//3; px[x,y]=(int(l*0.45)+20,int(l*0.25)+10,int(l*0.6)+30,a)
arts['gatekeeper']=g
# Lich king: wizard with bone face, black robe, gold crown
lk=recolor(tile(84),{'#9b4ca3':'#2a1838','#d176d0':'#5c2f7a','#f7c282':'#e8e4d4','#bd6c4a':'#9a9384','#c0cbdc':'#6f6a80','#aab7cc':'#575269','#8b9bb4':'#3d3a4d','#262b44':'#7df9ff'})
arts['lich_king']=lk
# heroes / npc
arts['hero']=tile(98)
# items
items={'health_potion':115,'mana_potion':116,'antidote':114,'strength_buff':113,'bomb':None,'fire_scroll':None,
 'iron_sword':104,'frost_dagger':103,'poison_dagger':105,'flame_sword':107,'dragonslayer':106,'godsword':131,
 'leather_armor':102,'chain_mail':101,'plate_armor':101,'coin':None,'key':None,'dice':None,'crown':None,'phoenix':None}
for k,v in items.items():
    if v is not None: arts['icon_'+k]=tile(v)
arts['icon_flame_sword']=recolor(tile(104),{'#c0cbdc':'#ff8a3d','#8b9bb4':'#e84537'})
arts['icon_frost_dagger']=recolor(tile(103),{'#c0cbdc':'#9ee8ff','#8b9bb4':'#4fb6e8'})
arts['icon_poison_dagger']=recolor(tile(105),{'#c0cbdc':'#9fe870','#8b9bb4':'#4f9a3a'})
arts['icon_dragonslayer']=recolor(tile(106),{'#c0cbdc':'#ffd84a','#8b9bb4':'#c08a1a'})
arts['icon_plate_armor']=recolor(tile(101),{'#bd6c4a':'#8b9bb4','#e19a65':'#c0cbdc','#763b36':'#52607c'})
arts['icon_speed_buff']=recolor(tile(113),{'#c0cbdc':'#ffe57a','#8b9bb4':'#d4a017'})
# hand-drawn small icons: d20, coin, scroll, bomb, feather, crown, key
def canvas(): return Image.new('RGBA',(16,16),(0,0,0,0))
def d20():
    c=canvas(); d=ImageDraw.Draw(c)
    hexp=[(8,1),(14,4),(14,11),(8,14),(2,11),(2,4)]
    d.polygon(hexp,fill=H('#6a0dad'),outline=H('#2a0848'))
    d.polygon([(8,4),(12,10),(4,10)],fill=H('#9b30d0'),outline=H('#e9c8ff'))
    d.line([(8,1),(8,4)],fill=H('#e9c8ff'));d.line([(2,11),(4,10)],fill=H('#e9c8ff'));d.line([(14,11),(12,10)],fill=H('#e9c8ff'))
    d.point([(7,8),(8,7),(9,8),(8,8)],fill=H('#ffffff'))
    return c
def coin():
    c=canvas(); d=ImageDraw.Draw(c); d.ellipse([3,3,12,12],fill=H('#f2c230'),outline=H('#7a4a10')); d.ellipse([5,5,10,10],outline=H('#ffe98a')); d.line([(8,6),(8,9)],fill=H('#b5801c')); return c
def scroll():
    c=canvas(); d=ImageDraw.Draw(c); d.rectangle([4,3,11,12],fill=H('#f3e2b8'),outline=H('#3f2631')); d.rectangle([3,2,12,3],fill=H('#c99a5b'),outline=H('#3f2631')); d.rectangle([3,12,12,13],fill=H('#c99a5b'),outline=H('#3f2631')); d.line([(6,6),(9,6)],fill=H('#e84537'));d.line([(6,8),(10,8)],fill=H('#e84537'));d.point([(7,10),(8,10)],fill=H('#ff8a3d')); return c
def bomb():
    c=canvas(); d=ImageDraw.Draw(c); d.ellipse([3,5,12,14],fill=H('#262b44'),outline=H('#0d0f1a')); d.point([(5,8),(6,7)],fill=H('#8b9bb4')); d.line([(9,5),(11,2)],fill=H('#bd6c4a')); d.point([(12,1),(11,1),(12,2)],fill=H('#ffd84a')); return c
def feather():
    c=canvas(); d=ImageDraw.Draw(c); d.polygon([(12,1),(14,4),(6,13),(4,12)],fill=H('#ff7a2a'),outline=H('#a8301a')); d.line([(3,14),(12,3)],fill=H('#ffe57a')); return c
def crown():
    c=canvas(); d=ImageDraw.Draw(c); d.polygon([(2,12),(2,5),(5,8),(8,3),(11,8),(14,5),(14,12)],fill=H('#f2c230'),outline=H('#7a4a10')); d.point([(5,10),(8,10),(11,10)],fill=H('#e84537')); return c
def key():
    c=canvas(); d=ImageDraw.Draw(c); d.ellipse([2,2,7,7],outline=H('#f2c230'),width=2); d.line([(6,6),(13,13)],fill=H('#f2c230'),width=2); d.point([(11,13),(12,12),(10,12)],fill=H('#c08a1a')); return c
arts['icon_dice']=d20(); arts['icon_coin']=coin(); arts['icon_fire_scroll']=scroll(); arts['icon_bomb']=bomb(); arts['icon_phoenix_feather']=feather(); arts['icon_crown']=crown(); arts['icon_key']=key()
for k,t in arts.items():
    t.save(f'out/{k}.png')
    s=128//t.width if t.width==16 else 5
    t.resize((t.width*s,t.height*s),Image.NEAREST).save(f'out/{k}@big.png')
# preview sheet
ks=list(arts); c=Image.new('RGBA',(12*72,((len(ks)+11)//12)*84),(40,40,40,255)); d=ImageDraw.Draw(c)
for i,k in enumerate(ks):
    t=arts[k].resize((64,64),Image.NEAREST); x=(i%12)*72;y=(i//12)*84; c.alpha_composite(t,(x+4,y+14)); d.text((x+2,y+1),k[:11],fill='yellow')
c.save('art_preview.png')
print(len(arts))
# crown overlay for lich king
lk=arts['lich_king'].copy(); px=lk.load()
G=H('#f2c230')+(255,); D=H('#7a4a10')+(255,); R=H('#e84537')+(255,); O=H('#3f2631')+(255,)
# clear hat area rows 0..4
for y in range(0,5):
    for x in range(16): px[x,y]=(0,0,0,0)
rows=["...O.O..O..O.O..",
      "..OGOGOOGOOGOGO.",
      "..OGGGGGGGGGGGO.",
      "..OGRGGGRGGGRGO.",
      "..OOOOOOOOOOOOO."]
for y,r in enumerate(rows):
    for x,ch in enumerate(r):
        if ch!='.': px[x,y]={'O':O,'G':G,'R':R}[ch]
arts['lich_king']=lk; lk.save('out/lich_king.png'); lk.resize((128,128),Image.NEAREST).save('out/lich_king@big.png')
lk.resize((256,256),Image.NEAREST).save('lich_zoom.png')
