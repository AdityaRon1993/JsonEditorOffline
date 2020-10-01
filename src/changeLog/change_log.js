const {ipcRenderer} = require('electron');


$("#close").on('click',()=>{
    // alert('clicked')
    ipcRenderer.invoke("CLOSE_CHANGEL_LOG",null).then(res=>{
        console.log(res)
    })
})
$(document).on('ready',()=>{
    ipcRenderer.invoke("GET_CHANGEL_LOG_DATA",null).then(res=>{
        createLog(res.reverse())
    })
})


function createLog(data){

    data.forEach(ele=>{
        const {changes,future,dropped} = ele;
        let change_html = [` <h4 class="mt-0 mb-1">Changes</h4>`]
        let future_html = [ `<h4 class="mt-0 mb-1">Future</h4>`]
        let dropped_html = [ `<h4 class="mt-0 mb-1">Dropped</h4>`]
        changes.forEach(change=>{
            change_html.push(`
            <a href="#" class="list-group-item list-group-item-action ">${change}</a>
            `)
        })
        future.forEach(fut=>{
            future_html.push(`
            <a href="#" class="list-group-item list-group-item-action ">${fut}</a>
            `)
        })
        dropped.forEach(drp=>{
            dropped_html.push(`
            <a href="#" class="list-group-item list-group-item-action ">${drp}</a>
            `)
        })

        $("#change_log").append(`
            <li class="media">
                <h2 class="mr-3">${ele.version}</h2>
                <div class="media-body">
                    <div id="changes">
                        ${change_html.join('')}
                    </div>
                    <div id="future">
                        ${future_html.join('')}
                    </div>
                    <div id="dropped">
                        ${dropped_html.join('')}
                    </div>
                </div>
            </li>
            <br><br>
        `)


    })



    $("#change_log").html()
}