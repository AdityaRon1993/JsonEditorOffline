const jsoneditor = require('jsoneditor')
const jsonDiff = require('json-diff')
const api = require('request-promise')
const fs = require('fs')
const path = require('path')
let diff_on = false;
let json_err = false
const p = path.join(__dirname , "../package.json")
const test_data = fs.readFileSync(p, 'utf-8')
const EventEmitter = require('events');
const headers_sample = ` <tr>
<th scope="row" class="table_key">
  <input class="form-control form-control-sm" type="text" placeholder="key">
</th>
<td class="table_value">
  <input class="form-control form-control-sm" type="text" placeholder="value">
</td>
<td class="table_delete">
  <a class="btn btn-outline-danger btn-sm" onclick="deleteRow(event)">
    <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
      <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
  </a>
</td>
</tr>`

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('json_error', () => {
  alert("CANNOT FIND DIFF IF JSON HAS ERROR")
});

const editor1 = document.getElementById("editor")
const editor2 = document.getElementById("editor2")
const req_body = document.getElementById("req_body")
const options = {
    modes : ["tree", "code", "form"], 
    mode : "code",
    search : true,
    onValidationError : function(err){
        if(err && err.length){
            this.container.style.outline = "3px dotted orangered"
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
const req_body_editor = new jsoneditor(req_body,options)

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
    if(diffmap){
        colorObject(map,diffmap)
    }
}


function colorChildren(childNode, path,color,isColorAllChild = false){
    try{
        childNode.dom[path].style.backgroundColor = color
    }catch(e){
        console.log(e)
        childNode.dom["value"].style.backgroundColor = color
    }
    if(isColorAllChild && childNode.childs && childNode.childs.length){
        childNode.childs.forEach(ele=>{
            colorChildren(ele,path,color,true)
        })
    }
}


function colorObject(node,diffmap){
    if(typeof diffmap != "object"){
        colorChildren(node,'field',"rgba(233,87,63,.3)")
        colorChildren(node,'value',"rgba(255,165,0,.3)")
        return;
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
                    colorChildren(ele,"field","rgba(233,87,63,.3)")
                    if(ele.childs && ele.childs.length){
                        if(Array.isArray(currentData)){
                            const workWith = currentData.filter(ele=>ele[0]!="+")
                            workWith.forEach((arr,i)=>{
                                if(arr[0]=='-' || arr[0]=="~"){
                                    colorObject(ele.childs[i].childs || ele.childs[i],arr[1])
                                }
                            })
                        }
                        colorObject(ele.childs,currentData)
                    }else{
                        colorChildren(ele,"value","rgba(255,165,0,.3)")
                    }
                }
            })
        }
    }
}

function addMoreHeaders(){
    console.log(
        $("#headers_t_body tr:last").after(headers_sample)
    )
}

function deleteRow(event){
    if(checkForLastRow()){
        alert("You cannot delete the last row");
        return;
    }
    $(event.target).closest("tr").remove();
}

$("#MyTable").on("click", "#DeleteButton", function() {
   $(this).closest("tr").remove();
});

function checkForLastRow(){
    return $("#headers_t_body").children().length == 1
}


$("#method").on('change',function(){
    if(this.value == "GET"){
        $("#req_body_block").css("display","none")
    }else{
        $("#req_body_block").css("display","block")
    }
})


function apiCall(){
}

(()=>{
    $("#req_body_block").css("display","none")
})()

// https://github.com/josdejong/jsoneditor/issues/603