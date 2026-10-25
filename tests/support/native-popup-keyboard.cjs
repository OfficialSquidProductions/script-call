'use strict';
// macOS datalist suggestions are a native popup. CDP Input.dispatchKeyEvent
// reaches the DOM field but bypasses that popup's navigation/commit handling.
// Send real key-down/up pairs through Electron's focused webContents instead.
// Never set an input value here: callers must assert the actual selection/events.
async function nativePopupKey(application,key){
 const keys={ArrowDown:'Down',ArrowUp:'Up',Enter:'Return',Escape:'Escape',Tab:'Tab'};
 if(process.platform!=='darwin'||!Object.hasOwn(keys,key))throw Error('Native popup keyboard QA supports explicit Mac navigation keys only.');
 return application.evaluate(({app,BrowserWindow},keyCode)=>{
  const window=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL()==='callsheet://app/index.html');
  if(!window||!window.isVisible())throw Error('Native popup QA requires a visible isolated test window.');
  app.focus({steal:true});window.focus();
  if(!window.isFocused())throw Error('Native popup QA requires the isolated app to own focus.');
  window.webContents.sendInputEvent({type:'keyDown',keyCode});
  window.webContents.sendInputEvent({type:'keyUp',keyCode});
 },keys[key]);
}
module.exports={nativePopupKey};
