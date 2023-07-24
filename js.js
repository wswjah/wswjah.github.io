const lrcData = parseLrc();
/**
* 数据处理函数，将str转换为数组
* @author wswja
* @return {Array} 
*/
function parseLrc() {
    let lines = lrc.split("\n");
    let result = []; // 歌词对象数组
    let singer = "";
    let heatshot = "";
    for (let i = 1; i < lines.length; i++) {
        let str = lines[i];
        let parts = str.split("]");
        let timeStr = parts[0].substring(9);
        let time = parseTime(timeStr);
        let words = parts[1];
        if(words.includes("{singer}")){
            words = parts[1].split("{singer}")[0]; 
            singer = parts[1].split(":")[0];
            heatshot = heatshots[singer];
        }
        let obj = {
            time: time,
            words: words,
            singer:singer,
            heatshot:heatshot
        };
        result.push(obj);
    }
    return result;
}
/**
 *@param {String} timeStr
 *@return {Number} 
 *@author wswja
 *@example parseTime("00:00.00");
*/
function parseTime(timeStr) {
    const parts = timeStr.split(":");
    return +parts[0] * 60 + +parts[1]; // +一元运算符转数字
}
// 获取需要的dom
const doms = {
    audio: document.querySelector("audio"),
    ul: document.querySelector(".lrc-list"),
    container: document.querySelector(".container"),
    headshot:document.querySelector("#headshot"),
    video:document.querySelector("#video")
};
/**
 * 寻找歌词下标
 * @return {Number}
*/
function findIndex() {
    const curTime = doms.audio.currentTime;//audio的当前时间
    for (let i = 0; i < lrcData.length; i++) {
        if (curTime < lrcData[i].time) {
            return lrcData[i - 1].words ? i - 1 : i - 2;
        }
    }
    // 找遍了没有找到（说明播放到歌词的最后一句）
    return lrcData.length - 1;
}
/**
 * 创建歌词的 <li> 标签
 * @return {null}
*/
function createElements() {//将<li>放到<ul>里面
    const frag = document.createDocumentFragment(); // 创建一个文档片段
    for (let i = 0; i < lrcData.length; i++) {
        const li = document.createElement("li");
        li.textContent = lrcData[i].words;
        if(lrcData[i].heatshot !== ""){
            li.innerHTML = `<img src="${lrcData[i].heatshot}" alt/>  ${lrcData[i].words} ` ;
        }
        const time = lrcData[i+1] ?  lrcData[i+1].time - lrcData[i].time : lasttime;
        li.style = `--time:${time}s;`;
        li.addEventListener("click",(e) =>{
            doms.audio.currentTime = lrcData[i].time;
            doms.audio.play();
        });
        frag.appendChild(li);
    }
    doms.ul.appendChild(frag);
}
createElements();
// 容器高度
const containerHight = doms.container.clientHeight;
//容器宽度
const containerWidth = doms.container.clientWidth;
// li的高度
const liHight = doms.ul.children[0].clientHeight;
// 偏移最大值
const maxOffset = doms.ul.clientHeight - containerHight / 2; // 播放完毕歌词居中
/**
 * 设置ul元素的偏移量,及歌词填充功能
 * @param {event} e
 * @return {null}
 */
function setOffset(e) {
    const curTime = doms.audio.currentTime;//获取当前时间 
    const index = findIndex();
    let offset = liHight * index + liHight / 2 - containerHight / 2;
    if (offset < 0) {
        offset = 0;
    }
    if (offset > maxOffset) {
        offset = maxOffset;
    }
    // 设置偏移量给ul
    doms.ul.style.transform = `translateY(-${offset}px)`;
    // 去掉之前的样式
    let li = doms.ul.querySelector(".active");
    if (li) {
        li.classList.remove("active");
        li.style.removeProperty("width");
    }
    // 高亮
    li = doms.ul.children[index];
    //534px
    let width;
    if(lrcData[index].heatshot){
        doms.headshot.setAttribute("src",lrcData[index].heatshot);
        width = getTextWidth(lrcData[index].words) + 30;
        if(lrcData[index].heatshot == "image/img1.png" || lrcData[index].heatshot == "image/img2.png"){
            doms.headshot.setAttribute("style","height:534px");
        }else{
            doms.headshot.setAttribute("style","height:300px");
        }
    }else{
        width = getTextWidth(lrcData[index].words);
        doms.headshot.setAttribute("src","image/锦鲤抄.jpg");
    }
    doms.video.currentTime = curTime;
   
    if (li) {
        li.classList.add("active");
        li.style.setProperty("width",`${width}px`);
    }
}
/**
 * 时间更新时调用的函数
 * @return {null}
*/
function timeUpdate(){
    return new Promise((resolve) => {
        runTask(setOffset,resolve);
    })
}
//监听audio的时间变化事件
doms.audio.addEventListener("timeupdate", timeUpdate);
doms.audio.addEventListener("pause",(e)=>{
    doms.video.pause();
});
doms.audio.addEventListener("play",(e)=>{
    doms.video.play();
});
/**
 * 不阻塞渲染地执行任务
 * @param {Function} task
 * @param {Function} callback
 * 
*/
function runTask(task,callback) {
    requestIdleCallback((idle)=>{
        if(idle.timeRemaining() > 0 ){
            task();
            callback();
        }
    })
}
window.onload = () => {
    doms.video.volume = 0;
}
function getTextWidth(text, options = {}) {
    const { size = 18, family = "Microsoft YaHei" } = options;
    var canvas = canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = `${size}px ${family}`;
    const metrics = ctx.measureText(text);
    const actual = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
    return Math.max(metrics.width, actual);
  }