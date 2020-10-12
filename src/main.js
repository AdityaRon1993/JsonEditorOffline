const { app, Menu, BrowserWindow, Tray,ipcMain , dialog , session} = require('electron');
const path = require('path');
const api = require('request-promise')
const fs = require("fs")
const change_log = require("./changeLog/change_log.json")
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}
let defaultPathToSaveFiles = app.getPath('documents')
let mainWindow
let childWindow = null
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    title : "JSON FORMATTER OFFLINE",
    webPreferences : {
      nodeIntegration : true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));


  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=>{
  createWindow();
  createmenu();
// Modify the user agent for all requests to the following urls.
  const filter = {
    urls: []
  }


  // session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
  //   // details.requestHeaders['User-Agent'] = 'MyAgent'
  //   // console.log("*****")
  //   // console.log(details.requestHeaders.Origin || "NO ORIGIN")
  //   // console.log(details.url)
  //   // console.log("*****")
  //   callback({ requestHeaders: details.requestHeaders })
  // })

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mainWindow = null,
    childWindow = null
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }

  
});

function createmenu(){
  const isMac = process.platform === 'darwin'

  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' } ,
        {
          label : "New Window" ,
          accelerator : "CommandOrControl+N",
          click : ()=>{
            createWindow()
          }
        },
        {
          label : "Save",
          accelerator : "CommandOrControl+S",
          click : ()=>{
            mainWindow.webContents.send("GET_JSON_DATA", "get JSON DATA")
          }
        },
        {
          label : "Set Defaullt",
          accelerator : "CommandOrControl+Q",
          click : ()=>{
            dialog.showOpenDialog(
              mainWindow,
              {
                defaultPath : defaultPathToSaveFiles,
                buttonLabel : "Select",
                properties : ["openDirectory","createDirectory"],
                message : "Select Default path to store data saved by you"
              }
            ).then(res=>{
              console.log(res)
              defaultPathToSaveFiles = res.filePaths[0] || defaultPathToSaveFiles
            })
          }
        }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: process.env.NODE_ENV == "test" ?[
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ] : 
      [
        { role: 'reload' },
        { role: 'forcereload' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

}
ipcMain.on('request-axios-action', (event, option) => {
  console.log(option)
  api(option).then(res=>{
    const data = {
      status : true,
      res
    }

    event.sender.send('request-axios', data);
  }).catch(e=>{
    data = {
      status : false,
      error : e
    }
    event.sender.send('request-axios', data);
    console.log(data)
  })

});




const saveFile = (filepath,data)=>{
  dialog.showSaveDialog(
    mainWindow,
    {
      type : "question",
      buttonLabel : "Save",
      defaultPath : `${filepath}.json`,
      title : "Save the current JSON",
      message : `Do you want to save this two JSONs`
    }
    ).then(res=>{
      console.log(res)
      if(res.canceled) return;
      saveJson(res.filePath,data)
      console.log(res.filePath,data)
      // dialog.showErrorBox('Done',JSON.stringify(res,null,"\t"))
    }).catch(err=>{
      
    })
}

const saveJson = async (path,data)=>{
  try{
    path = path.split('.').pop() != 'json' ? path + '.json' : path;

    fs.writeFileSync(path,JSON.stringify(data,null,"\t"))
    dialog.showMessageBox(mainWindow,{
      type : "info",
      buttons : ["OK"],
      message : `File is saved \n${path}`
    })
  }catch(e){
      dialog.showErrorBox('Error',`Error is saving file \n${path}`)
  }
}


ipcMain.on("SAVE_JSON_DATA", (event, data) => {
  console.log(data);
  let file_name = `JFO_${Date.now()}`;
  // dialog.showErrorBox('Done',JSON.stringify(data,null,"\t"))

  saveFile(`${defaultPathToSaveFiles}/${file_name}`,data) // show the request data
  
});




//open changeLog

ipcMain.handle("OPEN_CHANGE_LOG",()=>{
  try{
    if(!childWindow){
      childWindow = new BrowserWindow({
        width: 600,
        height: 700,
        title : "CHANGE LOG",
        backgroundColor : "#ffffff",
        parent : mainWindow,
        modal:true,
        resizable : false,
        webPreferences : {
          nodeIntegration : true
        }
      });
    
      // and load the index.html of the app.
      childWindow.loadFile(path.join(__dirname, '/changeLog/change_log.html'));
      return { status : true , msg : "window created"}
    }else{
      childWindow.focus()
    }
  }catch(e){
    return { status : false , err : e}
  }
  
})
//get shareable data
ipcMain.handle('get_sharable_data', async (event, data) => {
  const result = toBase64(JSON.stringify(data))
  console.log(result)
  return result
})
ipcMain.handle('get_decrypted_data', async (event, data) => {
  try{
    const result = toutf8(data);
    const json = JSON.parse(result)
   
    console.log(result)
    console.log(json)
    return {
      status : true,
      json
    }
  }catch(e){
    return {
      status : false,
      msg : `!! Wrong text shared !! \n Please put in the correct raw data`
    }
  }
})
//close childWindow
ipcMain.handle("CLOSE_CHANGEL_LOG",()=>{
  try{
    childWindow.close();
    childWindow = null;
    console.log("child window closed")
    // return { status : true , }
  }
  catch(e){
    console.log("child window close error")

    return { status : false , err : e}
  }
})
ipcMain.handle("GET_CHANGEL_LOG_DATA",()=>{
  return [...change_log]
})


function toBase64(str){
  return Buffer.from(str, 'binary').toString('base64')
}

function toutf8(str){
  return Buffer.from(str, 'base64').toString('utf8')
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
