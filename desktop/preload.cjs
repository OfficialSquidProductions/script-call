'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('CallSheet',{request:(action,args={})=>ipcRenderer.invoke('callsheet',action,args),onUpdates:cb=>ipcRenderer.on('update-status',(_,state)=>cb(state)),onCheckUpdates:cb=>ipcRenderer.on('check-updates',()=>cb()),onSave:cb=>ipcRenderer.on('menu-save',()=>cb()),onBeforeClose:cb=>ipcRenderer.on('before-close',()=>cb()),closeReady:()=>ipcRenderer.send('close-ready')});
