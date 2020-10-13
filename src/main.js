const { app, Menu, BrowserWindow,ipcMain} = require('electron');
const path = require('path');
const fs = require("fs")
const change_log = require("./changeLog/change_log.json");
let user_data_path = path.join(__dirname,"assets","user_data.json")
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
  defaultFolder()
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

function defaultFolder(){
    const path_to_default = path.join(defaultPathToSaveFiles,"JSON_OFFLINE_EDITOR")
    const isthere = fs.existsSync(path_to_default)
    if(!isthere){
      fs.mkdirSync(path_to_default)
    }
    const path_to_file = path.join(path_to_default,"user_data.json")
    const isThere_file = fs.existsSync(path_to_file);
    if(!isThere_file){
      const default_json = {
        "single_json" : [],
        "multiple_json" : []
    }
      fs.writeFileSync(path_to_file,JSON.stringify(default_json))
    }
    user_data_path = path_to_file
}

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


// ipcMain.on("SAVE_JSON_DATA", (event, data) => {
//   console.log(data);
// });

ipcMain.handle('SAVE_JSON_DATA', async (event, args) => {
  console.log(args)
  let user_data
  try{
    user_data= JSON.parse(await getUserData());
    console.log(user_data)
    if(args.single_json){
      user_data.single_json.push(args.data)
    }else{
      user_data.multiple_json.push(args.data)
    }
    const succ = await writeUserData(JSON.stringify(user_data))
    console.log(succ)
  }catch(e){
    console.log(e)
    return false
  }
  return true
})

ipcMain.handle('DELETE_JSON_DATA', async (event, args) => {
  console.log(args)
  let user_data
  try{
    user_data= JSON.parse(await getUserData());
    console.log(user_data)
    const {index,type} = args;
    const backup_type = user_data[type]
    backup_type.splice(index,1)
    user_data[type] = [...backup_type]
    const succ = await writeUserData(JSON.stringify(user_data))
    console.log(succ)
  }catch(e){
    console.log(e)
    return false
  }
  return true
})

function getUserData(){
  return new Promise((resolve,reject)=>{
    console.log(user_data_path)
    fs.readFile(user_data_path,"utf8",(err,data)=>{
      if(err) reject("unable to read file");
      resolve(data)
    })
  })
}
function writeUserData(data){
  return new Promise((resolve,reject)=>{
    console.log(user_data_path)
    fs.writeFile(user_data_path,data,(err,data)=>{
      if(err) reject("unable to read file");
      resolve("success")
    })
  })
}
//open changeLog


ipcMain.handle("GET_SAVED_DATA", async(event,arg)=>{
  if(arg){
    defaultFolder()
  }
  const user_data = JSON.parse(await getUserData());
  return user_data
})
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
