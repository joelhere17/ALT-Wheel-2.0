import asyncio, math, os, sys
from playwright.async_api import async_playwright
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(BASE,'tests','output'); os.makedirs(OUT,exist_ok=True)

async def icon_center(pg,name):
    loc=pg.locator('.fi',has_text=name).first
    b=await loc.bounding_box(); return b['x']+b['width']/2, b['y']+35

async def drag_to_petal(pg,name,idx,n,shot=None,release=True,switch=False):
    x,y=await icon_center(pg,name)
    await pg.mouse.move(x,y); await pg.mouse.down()
    await pg.mouse.move(x+70,y-70,steps=8); await pg.wait_for_timeout(600)
    if switch:
        if await pg.locator('#modebar span.on').get_attribute('data-m')!='tools':
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(150)
    r=await pg.locator('#wheel').bounding_box(); cx=r['x']+r['width']/2; cy=r['y']+r['height']/2
    k=r['width']/420; rad=135*k
    a=math.radians(idx*360/n)
    tx,ty=cx+math.sin(a)*rad, cy-math.cos(a)*rad
    await pg.mouse.move(tx,ty,steps=8); await pg.wait_for_timeout(300)
    if shot: await pg.screenshot(path=shot)
    if release: await pg.mouse.up()
    await pg.wait_for_timeout(500)

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':1100,'height':760}, accept_downloads=True)
        pg=await ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('file://'+BASE+'/index.html'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=OUT+'/01_desk.png')
        print('icons:', await pg.locator('.fi').count())
        # convert wheel for PNG source: items webp,heic,tiff,avif,bmp,pdf,docx,jpg
        await drag_to_petal(pg,'Sample Photo',0,8,shot=OUT+'/02_convert_hover.png',release=False)
        print('center text while hovering:', await pg.text_content('#ctext'))
        await pg.mouse.up(); await pg.wait_for_timeout(600)
        print('icons after webp:', await pg.locator('.fi').count(), '| toast:', await pg.inner_text('#toast'))
        names=['webp','heic','tiff','avif','bmp','pdf','docx','jpg']
        for i,nm in enumerate(names[1:],1):
            await drag_to_petal(pg,'Sample Photo.png' if False else 'Sample Photo',i,8)
            print(nm,'->',await pg.inner_text('#toast'))
        await pg.screenshot(path=OUT+'/03_after_convert.png')
        # tools wheel
        await drag_to_petal(pg,'Sample Page',5,7,shot=OUT+'/04_tools_hover.png',release=False,switch=True)
        print('tools center:', await pg.text_content('#ctext'))
        await pg.mouse.up(); await pg.wait_for_timeout(900)
        await pg.screenshot(path=OUT+'/05_crop.png')
        # change ratio to 1:1 and apply
        await pg.click('.chip[data-v="1"]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'/06_crop_11.png')
        await pg.click('#apply'); await pg.wait_for_timeout(700)
        print('after crop toast:', await pg.inner_text('#toast'))
        # add bg on cropped
        await drag_to_petal(pg,'Sample Page Cropped',4,7,switch=True)
        await pg.wait_for_timeout(500); await pg.screenshot(path=OUT+'/07_addbg.png')
        await pg.fill('#pad','240'); await pg.dispatch_event('#pad','input')
        await pg.click('.chip[data-v="1"]'); await pg.wait_for_timeout(300)
        await pg.click('#apply'); await pg.wait_for_timeout(1500)
        print('after bg toast:', await pg.inner_text('#toast'))
        await pg.screenshot(path=OUT+'/08_desk_end.png')
        # other tools smoke test
        for idx,nm in [(0,'compress'),(1,'metadata'),(2,'edit'),(3,'annotate'),(6,'redact')]:
            await drag_to_petal(pg,'Sample Photo',idx,7,switch=True); await pg.wait_for_timeout(800)
            await pg.screenshot(path=OUT+'/09_%s.png'%nm)
            has=await pg.locator('.modal').count()
            print(nm,'modal open:',has)
            if nm=='compress': await pg.wait_for_timeout(600); print('  result:',await pg.inner_text('#res'))
            if nm=='annotate':
                bx=await pg.locator('#pv').bounding_box()
                await pg.mouse.move(bx['x']+20,bx['y']+20); await pg.mouse.down(); await pg.mouse.move(bx['x']+120,bx['y']+90,steps=6); await pg.mouse.up()
            if nm=='redact':
                bx=await pg.locator('#pv').bounding_box()
                await pg.mouse.move(bx['x']+30,bx['y']+30); await pg.mouse.down(); await pg.mouse.move(bx['x']+150,bx['y']+100,steps=6); await pg.mouse.up()
            if nm in ('compress','annotate','redact','edit'):
                await pg.click('#apply'); await pg.wait_for_timeout(900)
                print('  ',await pg.inner_text('#toast'))
            else:
                await pg.keyboard.press('Escape')
            await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+'/10_desk_full.png')
        # save every file by double click and collect downloads
        n=await pg.locator('.fi').count(); print('total icons',n)
        for i in range(n):
            loc=pg.locator('.fi').nth(i); nm=(await loc.inner_text()).strip()
            try:
                async with pg.expect_download(timeout=6000) as dl:
                    await loc.dblclick()
                d=await dl.value; path=OUT+'/dl_'+d.suggested_filename; await d.save_as(path); print('saved',d.suggested_filename)
            except Exception as ex:
                print('NO DOWNLOAD for',repr(nm),'toast:',await pg.inner_text('#toast'))
        print('errors:',[e for e in errs if 'fonts' not in e and 'ERR_' not in e])
        await b.close()
asyncio.run(main())
