const jsoneditor = require('jsoneditor')
const jsonDiff = require('json-diff')
const fs = require('fs')
const path = require('path')
let diff_on = false;
let json_err = false
const p = path.join(__dirname , "../package.json")
const test_data = fs.readFileSync(p, 'utf-8')
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('json_error', () => {
  alert("CANNOT FIND DIFF IF JSON HAS ERROR")
});

const editor1 = document.getElementById("editor")
const editor2 = document.getElementById("editor2")
const options = {
    modes : ["tree", "code", "form"], 
    mode : "code",
    search : true,
    onValidationError : function(err){
        if(err && err.length){
            this.container.style.outline = "3px solid orangered"
            json_err = true;
            if(diff_on) myEmitter.emit('json_error');
        }else{
            json_err = false
            this.container.style.outline = "transparent"
        }
    },
    onModeChange : (mode)=>{
        console.log(mode)
    }
}
const editor_one = new jsoneditor(editor1,options)
const editor_two = new jsoneditor(editor2,options)

let diff = (event)=>{
    event.target.classList.toggle("active")
    diff_on = !diff_on
    if(diff_on && json_err){
        myEmitter.emit('json_error');
        event.target.classList.toggle("active")
        diff_on = !diff_on
    }else if(diff_on && !json_err){
        colourEditor(editor_one,jsonDiff.diff(editor_one.get(),editor_two.get()))
        colourEditor(editor_two,jsonDiff.diff(editor_two.get(),editor_one.get()))
        // document.getElementById("error_number").innerText = "19";
        // document.getElementById("multiple").innerText = "(s)";
    }else{
        document.getElementById("error_number").innerText = "";
        document.getElementById("multiple").innerText = "";
    }
}

const controls = Array.from( document.getElementsByClassName('control') )

controls.forEach(ele=>{
    ele.addEventListener('click',(event)=>{
        const attr = event.target.getAttribute("button-function")
        switch(attr){
            case "left" : 
                editor_two.set(editor_one.get());
                break;
            case "right" : 
                editor_one.set(editor_two.get());
                break;
            case "API" : 
                alert("JSON FROM API");
                break;
            default : 
                alert("SOMETHING WENT WRONG")

        }
    })
})


const hide_side = function(){
    document.querySelector(".sidemenu").classList.toggle("hide-menu")
    document.querySelector(".side-menu-background").classList.toggle("hide-side-menu-back")
}
document.getElementById('menu').addEventListener('click',hide_side)
document.getElementById('cross').addEventListener('click',hide_side)
document.querySelector('.side-menu-background').addEventListener('click',hide_side)




function colourEditor(editor, diffmap){
    console.log(diffmap)
    if(editor.getMode() !="tree") {alert("FUCK YOU"); return;}
    editor.expandAll();
    const map = editor.node.childs
    colorObject(map,diffmap)
}


function colorChildren(childNode, path,color,isColorAllChild = false){
    childNode.dom[path].style.backgroundColor = color
    if(isColorAllChild && childNode.childs && childNode.childs.length){
        childNode.childs.forEach(ele=>{
            colorChildren(ele,path,color,true)
        })
    }
}


function colorObject(node,diffmap){
    if(typeof diffmap != "object"){
        colorChildren(node,'tree',"pink")
    }
    for(key in diffmap){
        currentData = diffmap[key]
        if(key.indexOf("__deleted") > -1){
            const realKey = key.replace("__deleted","")
            node.map(ele=>{
                if(ele.field == realKey){
                    colorChildren(ele,"tree","rgba(233,87,63,.3)", true) 
                    // if(typeof currentData === "object" &&  Object.keys(currentData).length){
                    // }
                }
            })
        }else{
            node.map(ele=>{
                if(ele.field == key){
                    console.log("normal" ,key)
                    colorChildren(ele,"field","pink")
                    if(ele.childs && ele.childs.length){
                        if(Array.isArray(currentData)){
                            const workWith = currentData.filter(ele=>ele[0]!="+")
                            workWith.forEach((arr,i)=>{
                                if(arr[0]=='-'){
                                    colorObject(ele.childs[i].childs || ele.childs[i],arr[1])
                                }
                            })
                        }
                        colorObject(ele.childs,diffmap)
                    }else{
                        colorChildren(ele,"value","purple")
                    }
                }
            })
        }
    }
}
// https://github.com/josdejong/jsoneditor/issues/603