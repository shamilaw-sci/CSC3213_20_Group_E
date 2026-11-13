const fs=require('node:fs'),p=__dirname+'/hygiene.cjs';let h=fs.readFileSync(p,'utf8');
h=h.replace("'/hd-markup-before.snapshot','utf8').split", "'/hd-markup-before.snapshot','utf8').replaceAll('currentHDSizeMB','currentSizeMB').replaceAll('MAX_HD_MB','maxSizeMB').replaceAll('hdProgress','progress').replaceAll('images.length','imageCount').replaceAll('handleImageUpload','onUpload').replaceAll('removeImage','onRemove').split");
fs.writeFileSync(p,h);
