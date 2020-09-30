const jsoneditor = require('jsoneditor')
let diff_on = false;
let json_err = false
const EventEmitter = require('events');
const headers_sample = $('#headers_t_body').html()
const {diff} = require('deep-diff');
let showDiff = false;
const { shell } = require('electron') // used in HTML
const req_sample = $('#req_t_body').html()

class MyEmitter extends EventEmitter { }

const myEmitter = new MyEmitter();
myEmitter.on('json_error', () => {
    alert("CANNOT FIND DIFF IF JSON HAS ERROR")
});

const editor1 = document.getElementById("editor")
const editor2 = document.getElementById("editor2")
const req_data_json_editor = document.getElementById("req_data_json_editor")
const options = {
    modes: ["tree", "code"],
    mode: "code",
    onValidationError: function (err) {
        if (err && err.length) {
            this.container.style.outline = "3px dotted orangered"
            json_err = true;
            if (diff_on) myEmitter.emit('json_error');
        } else {
            json_err = false
            this.container.style.outline = "transparent"
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
const req_body_editor = new jsoneditor(req_data_json_editor, options)

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
        colourEditor(editor_one, diff(editor_one.get(), editor_two.get()))
        colourEditor(editor_two, diff(editor_two.get(),editor_one.get()))
        const no_of_diff = diff(editor_one.get(),editor_two.get()).filter(ele=>ele.lhs).length
        $("#error_number").html(no_of_diff) 
        if(no_of_diff > 1){
            $("#multiple").html('s')
        }
    }
}

const controls = Array.from(document.getElementsByClassName('control'))

controls.forEach(ele => {
    ele.addEventListener('click', (event) => {
        const attr = event.target.getAttribute("button-function")
        switch (attr) {
            case "left":
                editor_two.set(editor_one.get());
                break;
            case "right":
                editor_one.set(editor_two.get());
                break;
            case "API":
                alert("JSON FROM API");
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


// https://github.com/josdejong/jsoneditor/issues/603