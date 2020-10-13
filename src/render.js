const jsoneditor = require('jsoneditor')
let diff_on = false;
let json_err = false
const EventEmitter = require('events');
const headers_sample = $('#headers_t_body').html()
const {diff} = require('deep-diff');
let showDiff = false;
const { shell, ipcMain } = require('electron') // used in HTML
const req_sample = $('#req_t_body').html()
const {ipcRenderer} = require('electron')
class MyEmitter extends EventEmitter { }
const { clipboard } = require('electron');


let user_data = null;
getuserData().then(res=>{
    console.log(res)
})


const myEmitter = new MyEmitter();
myEmitter.on('json_error', () => {
    alert("CANNOT FIND DIFF IF JSON HAS ERROR")
});

const editor1 = document.getElementById("editor")
const editor2 = document.getElementById("editor2")
// const req_data_json_editor = document.getElementById("req_data_json_editor")
const options = {
    modes: ["tree", "code"],
    mode: "code",
    onValidationError: function (err) {
        if (err && err.length) {
            this.container.style.border = "3px dotted orangered"
            json_err = true;
            if (diff_on) myEmitter.emit('json_error');
        } else {
            json_err = false
            this.container.style.border = "transparent"
        }
    },
    onModeChange: (mode) => {
        if(showDiff) getDiff();
    },
    onChangeText : (jsonString)=>{
        if(showDiff) {
            clearAllDiff(editor_one.node)
            clearAllDiff(editor_two.node)
            getDiff();
        }
    }
}
const editor_one = new jsoneditor(editor1, options)
const editor_two = new jsoneditor(editor2, options)
// const req_body_editor = new jsoneditor(req_data_json_editor, options)

let diffE = (event) => {
    showDiff = !showDiff
    $(event.target).toggleClass('active')
    if(showDiff){
        getDiff()
    }else{
        $("#error_number").html('')
        $("#multiple").html('')
        clearAllDiff(editor_one.node)
        clearAllDiff(editor_two.node)
    }
}

let getDiff = ()=>{
    if (!json_err) {
        try{
            colourEditor(editor_one, diff(editor_one.get(), editor_two.get()))
            colourEditor(editor_two, diff(editor_two.get(),editor_one.get()))
            const no_of_diff = diff(editor_one.get(),editor_two.get()).filter(ele=>ele.lhs).length
            $("#error_number").html(no_of_diff) 
            if(no_of_diff > 1){
                $("#multiple").html('s')
            }
        }catch(e){
            $("#error_number").html('') 
            $("#multiple").html('')
            alert("Difference cannot be determined")
        }
    }
}

const controls = Array.from(document.getElementsByClassName('control'))

controls.forEach(ele => {
    ele.addEventListener('click', function(event) {
        console.log(this)
        const attr = this.getAttribute("button-function")
        switch (attr) {
            case "left":
                editor_two.set(editor_one.get());
                break;
            case "right":
                editor_one.set(editor_two.get());
                break;
            case "share":
                (async()=>{
                    if(json_err) {alert('there is an error in any of the JSONs'); return}
                    const data_arg = {
                        editor_one : { name : $("#editor_name_one").val() || "one",data : editor_one.get()},
                        editor_two : { name : $("#editor_name_two").val() || "two" ,data : editor_two.get()}
                    }
                    const share_data = await ipcRenderer.invoke('get_sharable_data',data_arg)
                    $("#data_share").html(share_data)
                    $('#share_data').modal('show')
                })()
                break;
            case "import":
                (async()=>{
                    const data = $("#import_text").val().trim()
                    console.log(data)
                    if(data == "") { alert("Please Enter some data"); return;}
                    const share_data = await ipcRenderer.invoke('get_decrypted_data',data)
                    if(share_data.status){
                        if(share_data.json.editor_one){
                            editor_one.set(share_data.json.editor_one.data)
                            $("#editor_name_one").val(share_data.json.editor_one.name || "")
                        }
                        if(share_data.json.editor_two){
                            editor_two.set(share_data.json.editor_two.data)
                            $("#editor_name_two").val(share_data.json.editor_two.name || "")
                        }
                        $("#import_text").val('');
                        $('#import').modal('hide')
                    }else{
                        alert(share_data.msg)
                    }
                    console.log(share_data)
                })()
                break;
            case "download":
                    $('#import').modal('show')
                    
                break;
            case "diff":
                diffE(this)
                break;
            case "copy":
                const success = copyToClipboard("#data_share")
                if(success) {return}
                alert("Failed to copy")
                break;
            default:
                alert("SOMETHING WENT WRONG")

        }
    })
})


const hide_side = function () {
    document.querySelector(".sidemenu").classList.toggle("hide-menu")
    document.querySelector(".side-menu-background").classList.toggle("hide-side-menu-back")
}
document.getElementById('menu').addEventListener('click', hide_side)
document.getElementById('cross').addEventListener('click', hide_side)
document.querySelector('.side-menu-background').addEventListener('click', hide_side)

function addMoreToTable(id) {
    switch (id) {
        case "req_t_body":
            $(`#${id} tr:last`).after(req_sample);
            break;
        case "headers_t_body":
            $(`#${id} tr:last`).after(headers_sample);
            break;
    }
}

function deleteRow(event, id) {
    if (checkForLastRow(id)) {
        alert("You cannot delete the last row");
        return;
    }
    $(event.target).closest("tr").remove();
}

$("#MyTable").on("click", "#DeleteButton", function () {
    $(this).closest("tr").remove();
});

function checkForLastRow(id) {
    return $(`#${id}`).children().length == 1
}


$("#method").on('change', function () {
    if (this.value == "GET") {
        $("#req_body_block").css("display", "none")
    } else {
        $("#req_body_block").css("display", "block")
    }
})

function changeForm(event) {
    const that = event.target
    console.log(
        $(that).parent().parent().parent().parent().find('td#req_body_value')

    )
    switch (that.value) {
        case "FILE": $(that).parent().parent().parent().parent()
            .find('td#req_body_value')
            .html(`
                                    <input type="file" class="form-control-file" id="req_body_data">
                                `)
            break;
        case "TEXT": $(that).parent().parent().parent().parent()
            .find('td#req_body_value')
            .html(`
                                    <input class="form-control form-control-sm" id="req_body_data" type="text" placeholder="value">
                                `)
            break;
    }
}

$("#api_call").on('click',()=>{
    fetch('https://jsonplaceholder.typicode.com/todos/1')
    .then(response => response.json())
    .then(json => console.log(json))
})



function getReqFormData() {
    let req_body_formData = new FormData()
    const tr = Array.from($('#req_body_table').find("#req_t_body").children())
    tr.forEach(tr_ele => {
        // const inside_tr = $(tr_ele).children()
        const isFile = $(tr_ele).find("#req_body_json").val() == "FILE"
        const key = $(tr_ele).find("req_body_key").val()
        const req_body_data = isFile ? $(tr_ele).find("#req_body_data")[0].files : $(tr_ele).find("#req_body_data").val()
        req_body_formData.append(
            `${key}${isFile ? "[]" : ""}`,
            req_body_data
        )
        console.dir(req_body_formData)
        return req_body_formData
    })
}

function getReqHeaderJson() {
    let header = {}
    const tr = Array.from($('#req_headers_table').find("#headers_t_body").children())
    tr.forEach(tr_ele => {
        const header_key = $(tr_ele).find("#header_key").val()
        const header_value = $(tr_ele).find("#header_value").val()
        if (header_key.trim() != "") {
            header[header_key] = header_value
        }
        // const inside_tr = $(tr_ele).children()

    })
    return header
}

$(".body-mode").on('click', function () {
    $("#selected_mode").html($(this).html())
    req_body_mode = $(this).html()
})

function colourEditor(editor, diffMap) {
    // editor.setMode("tree")
    if(editor.getMode() !='tree') return;
    editor.expandAll()
    if(!diff) return;
    const current_path = editor.node.childs
    const actualDiff = diffMap.filter(ele=> ele.lhs)
    actualDiff.forEach(individualDiff=>{
        mapDiff(current_path , individualDiff.path, individualDiff.kind)
    })
    console.log(actualDiff)
}

function mapDiff($_node, diff_path, kind) {
    let node = [...$_node]
    diff_path.forEach(individual_path=>{
        if(typeof individual_path =="string"){
            let new_node = node.filter(ele=>ele.field == individual_path)[0];
            new_node.dom.tree.style.backgroundColor = "rgba(255,165,0,.3)"
            if(new_node.childs){
                node = [...new_node.childs]
            }else{
                if(kind == "D"){
                    new_node.dom.tree.style.backgroundColor = "rgba(233,87,63,.3)"
                }else{
                    new_node.dom.tdValue.style.backgroundColor = "rgba(233,87,63,.3)"
                }
            }
        }else{
            node[individual_path].dom.tree.style.backgroundColor = "rgba(255,165,0,.3)"
            let new_node = [...node[individual_path].childs]
            node = [...new_node]
        }
    })
}

clearAllDiff = (node)=>{
    node.dom.tree.style.backgroundColor = "transparent"
    node.dom.tdValue.style.backgroundColor = "transparent"
    if(node.childs && node.childs.length>0){
        node.childs.forEach(ele=>{
            clearAllDiff(ele)
        })
    }
}
const openChangeLog = (event)=>{
    event.preventDefault()
    ipcRenderer.invoke('OPEN_CHANGE_LOG',null).then(res=>{
        console.log(res)
    })
}

const version = require('electron').remote.app.getVersion();
$("#version").html(version)

const openInExternalBrowser = (event)=>{
    event.preventDefault();
    let externalUrl = event.target.href
    
    try{
        shell.openExternal(externalUrl)
    }catch(e){
        alert('cannot open ', externalUrl)
    }
}
ipcRenderer.on("GET_JSON_DATA", (event, data) => {
    console.log(data);
    if(json_err) { alert("!! JSON has error !!\n!! Please resolve the error !!"); return;}
    const editor_name_one = $("#editor_name_one").val().trim();
    const editor_name_two = $("#editor_name_two").val().trim();
    if(editor_name_one == "" || editor_name_one.length == 0 || editor_name_two == "" || editor_name_two.length == 0){
        alert("Name for editor one and two are compulsory")
    }
    const sendData = {
        id : Date.now(),
        single_json: false,
        data : [
            {
                editor : "1",
                name : $("#editor_name_one").val(),
                json : editor_one.get()
            },
            {
                editor : "2",
                name : $("#editor_name_two").val(),
                json : editor_two.get()
            }
        ]

    }
     save_json_to_file(sendData)
  });


const save_json = Array.from(document.querySelectorAll("#save_json"))
save_json.forEach(ele=>{
    $(ele).on("click",function(){
        const name = $(this).parent().parent().find(".editor_name").val().trim()
        const attr = $(this).parent().parent().find(".editor_name").attr("data-editor")
        let json = null;
        if(name == "" || name.length == 0) {
            alert("Name is needed")
            return;
        }
        if(json_err){ alert("!! JSON has error !!\n!! Please resolve the error !!"); return;}
        switch(attr){
            case "1" : 
                json = editor_one.get(); 
                break;
            case "2" : 
                json = editor_two.get();
                break;
        } 
        const param = {
            id : Date.now(),
            single_json: true,
            data : [
                {
                    editor : attr,
                    name,
                    json
                }
            ]

        }
        save_json_to_file(param)

    })
})

async function save_json_to_file(data){
    const res = await ipcRenderer.invoke("SAVE_JSON_DATA", data);
    const user_data_local= await getuserData()
    console.log(user_data_local)
}


async function getuserData (){
    Array.from(document.querySelectorAll("#share")).forEach(ele=>{
        $(ele).off()
    })
    Array.from(document.querySelectorAll("#show")).forEach(ele=>{
        $(ele).off()
    })
    Array.from(document.querySelectorAll("#delete")).forEach(ele=>{
        $(ele).off()
    })
    const res = await ipcRenderer.invoke("GET_SAVED_DATA");
    user_data = res
    renderSingle(res.single_json)
    renderMultiple(res.multiple_json)
    Array.from(document.querySelectorAll("#share")).forEach(ele=>{
        $(ele).on('click',function(){
            const index = $(this).attr("data-index")
            const type = $(this).attr("data-type")
            try{
                const concerned_data = user_data[type][index]
                const editor1 =  concerned_data.filter(e=>e.editor == "1")
                const editor2 =  concerned_data.filter(e=>e.editor == "2")
                let data_arg = {}
                if(editor1.length > 0){
                    data_arg.editor_one = {
                        name : editor1[0].name,
                        data : editor1[0].json
                    }
                }
                if(editor2.length > 0){
                    data_arg.editor_two = {
                        name : editor2[0].name,
                        data : editor2[0].json
                    }
                }
                (async()=>{
                    const share_data = await ipcRenderer.invoke('get_sharable_data',data_arg)
                    $("#data_share").html(share_data)
                    $('#share_data').modal('show')
                })()
            }catch(e){
                alert("Something went wrong")
            }
        })
    })
    Array.from(document.querySelectorAll("#show")).forEach(ele=>{
        $(ele).on('click',function(){
            const index = $(this).attr("data-index")
            const type = $(this).attr("data-type")
            try{
                const concerned_data = user_data[type][index]
                console.log(concerned_data)
                concerned_data.forEach(ele=>{
                    if(ele.editor === "1"){
                        editor_one.set(ele.json)
                        $("#editor_name_one").val(ele.name)
                    }else{
                        editor_two.set(ele.json)
                        $("#editor_name_two").val(ele.name)
                    }
                })
                $("#cross").click()
            }catch(e){
                alert("Something went wrong")
            }

        })
    })
    Array.from(document.querySelectorAll("#delete")).forEach(ele=>{
        $(ele).on('click',function(){
            console.log("delete")
            const index = $(this).attr("data-index")
            const type = $(this).attr("data-type")
            param = {index,type}
           deleteData(param).then(da=>{
               console.log(da)
           })
        })
    })
    return res
}

async function deleteData(param){
    try{
        const _res = await ipcRenderer.invoke("DELETE_JSON_DATA", param);
        console.log(_res);
        await getuserData()
        return true
    }catch(e){
        return false
    }
}
function renderSingle(data){
    const tr = []

    data.forEach((ele, i)=>{
        tr.push(`
            <tr>
                <td scope="row">${i+1}</td>
                <td> ${ele[0].name} </td>
                <td> EDITOR-${ele[0].editor}</td>
                <td> 
                    <button type="button" class="btn btn-outline-primary btn-sm" id="show" data-type="single_json" data-index="${i}" data-work="show"  >
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-bar-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8zm-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5z"/>
                        </svg>
                    </button> 
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="share" data-type="single_json" data-index="${i}" data-work="share"  >
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-share-fill" fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd"
                            d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z" />
                        </svg>
                    </button> 
                </td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm" id="delete" data-type="single_json" data-index="${i}" data-work="delete"  >
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button> 
                </td>
            </tr>
        `)
    })


    $(".single").html(`
    <table class="table table-sm">
    <thead>
        <th scope="col">#</th>
        <th scope="col">Editor Name</th>
        <th scope="col"> Origin </th>
        <th scope="col" colspan=2>Action</th>
    </thead>
    <tbody>
      ${tr.join('')}
    </tbody>
  </table>
    `)

}
function renderMultiple(data){
    const tr = []

    data.forEach((ele, i)=>{
        tr.push(`
            <tr>
                <td scope="row">${i+1}</td>
                <td> ${ele[0].name} </td>
                <td> ${ele[1].name} </td>
                <td> 
                    <button type="button" class="btn btn-outline-primary btn-sm" id="show" data-type="multiple_json" data-index="${i}" data-work="show"  >
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-bar-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8zm-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5z"/>
                        </svg>
                    </button> 
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="share" data-type="multiple_json" data-index="${i}" data-work="share"  >
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-share-fill" fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd"
                            d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z" />
                        </svg>
                    </button> 
                </td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm" id="delete" data-type="multiple_json" data-index="${i}" data-work="delete"  >
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button> 
                </td>
            </tr>
        `)
    })


    $(".multiple").html(`
    <table class="table table-sm">
    <thead>
        <th scope="col">#</th>
        <th scope="col">Editor 1</th>
        <th scope="col">Editor 2</th>
        <th scope="col" colspan=2>Action</th>
    </thead>
    <tbody>
      ${tr.join('')}
    </tbody>
  </table>
    `)
}

function showData(event){
    console.log(event.target)

}
function shareData(event){
    console.log(event.target)

}


function copyToClipboard(elem) {
    
    const cp = $(elem).text()
    clipboard.writeText(cp)

    return true
}

// https://github.com/josdejong/jsoneditor/issues/603