const jsoneditor = require('jsoneditor')
const jsonDiff = require('json-diff')
const axios = require('axios')
const { ipcRenderer } = require('electron');
const fs = require('fs')
const path = require('path')
let diff_on = false;
let json_err = false
const p = path.join(__dirname , "../package.json")
const test_data = fs.readFileSync(p, 'utf-8')
const EventEmitter = require('events');
const headers_sample = $('#headers_t_body').html()
let req_body_mode = "JSON"

const req_sample = $('#req_t_body').html()

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('json_error', () => {
  alert("CANNOT FIND DIFF IF JSON HAS ERROR")
});

const editor1 = document.getElementById("editor")
const editor2 = document.getElementById("editor2")
const req_data_json_editor = document.getElementById("req_data_json_editor")
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
const req_body_editor = new jsoneditor(req_data_json_editor,options)

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

function addMoreToTable(id){
    switch(id){
        case "req_t_body": 
            $(`#${id} tr:last`).after(req_sample);
            break;
        case "headers_t_body" : 
            $(`#${id} tr:last`).after(headers_sample);
            break;
    }
}

function deleteRow(event,id){
    if(checkForLastRow(id)){
        alert("You cannot delete the last row");
        return;
    }
    $(event.target).closest("tr").remove();
}

$("#MyTable").on("click", "#DeleteButton", function() {
   $(this).closest("tr").remove();
});

function checkForLastRow(id){
    return $(`#${id}`).children().length == 1
}


$("#method").on('change',function(){
    if(this.value == "GET"){
        $("#req_body_block").css("display","none")
    }else{
        $("#req_body_block").css("display","block")
    }
})

function changeForm(event){
    const that = event.target
    console.log(
        $(that).parent().parent().parent().parent().find('td#req_body_value')

    )
    switch(that.value){
        case "FILE" :   $(that).parent().parent().parent().parent()
                                .find('td#req_body_value')
                                .html(`
                                    <input type="file" class="form-control-file" id="req_body_data">
                                `)
                        break;
        case "TEXT" :   $(that).parent().parent().parent().parent()
                                .find('td#req_body_value')
                                .html(`
                                    <input class="form-control form-control-sm" id="req_body_data" type="text" placeholder="value">
                                `)
                        break;
    }
}

$("#api_call").on('click',apiCall)
async function apiCall(){
    const url = $("#req_url").val();
    const method = $("#method").val();
    const req_body = req_body_mode == "JSON" ? req_body_editor.get() : getReqFormData()
    const headers = getReqHeaderJson()
    const options = {
        uri : url,
        method,
        body : req_body,
        headers
    }
    if(method == "get"){
        delete options.body
    }
    if(Object.keys(headers).length == 0){
        delete options.headers
    }
    const a = ipcRenderer.send('request-axios-action', options);
}
ipcRenderer.on('request-axios', (event, res) => {
    if(res.status){
        console.log(JSON.parse(res.res))
        const local_data = JSON.parse(res.res)
        $("#res_json").html(
            JSON.stringify(local_data,null,"\t")
        )
        $("#response").addClass("show")
    }else{
        const local_data = JSON.parse(res)
        $("#res_json").html(
            JSON.stringify(local_data,null,"\t")
        )
        $("#response").addClass("show")
    }
});
(()=>{
    $("#req_body_block").css("display","none")
})()




function getReqFormData(){
    let req_body_formData = new FormData()
    const tr = Array.from($('#req_body_table').find("#req_t_body").children())
    tr.forEach(tr_ele=>{
        // const inside_tr = $(tr_ele).children()
        const isFile = $(tr_ele).find("#req_body_json").val() == "FILE" 
        const key = $(tr_ele).find("req_body_key").val()
        const req_body_data = isFile? $(tr_ele).find("#req_body_data")[0].files : $(tr_ele).find("#req_body_data").val()
        req_body_formData.append(
            `${key}${isFile?"[]":""}`,
            req_body_data
        )
        console.dir(req_body_formData)
        return req_body_formData
    })
}

function getReqHeaderJson(){
    let header = {}
    const tr = Array.from($('#req_headers_table').find("#headers_t_body").children())
    tr.forEach(tr_ele=>{
        const header_key = $(tr_ele).find("#header_key").val()
        const header_value = $(tr_ele).find("#header_value").val()
        if(header_key.trim() !=""){
            header[header_key] = header_value
        }
        // const inside_tr = $(tr_ele).children()
        
    })
    return header
}

$(".body-mode").on('click',function(){
    $("#selected_mode").html($(this).html())
    req_body_mode = $(this).html()
})
// https://github.com/josdejong/jsoneditor/issues/603