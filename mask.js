// ==UserScript==
// @name         webmask
// @name:en      Add a mask into the website
// @version      1.0
// @match        *://www.bilibili.com/bangumi/*
// @namespace    http://tampermonkey.net/
// @description  为网页添加一个遮罩，可以用来遮蔽字幕练习日语，可自行修改match网址以适配其他网页
// @author       You
// @grant        none
// ==/UserScript==
(function () {
  "use strict";
  let videoRect;
  let maskH;
  let pointX;
  let pointY;
  let initialWidth;
  let initialHeight;
  let moveFlag = false;
  let maskTop;
  let resizeFlag = false;
  const mask = document.createElement("div");
  // mask.innerHTML = '<div id="resize" style="background-color: red;position: absolute;width: 10px;height: 10px;right: 0px;top: 0px;"></div>';
  mask.setAttribute("id", "mask");
  // mask.setAttribute('title', '快捷键c：隐藏/显示 鼠标拖拽：上下移动')
  mask.style.position = "fixed";
  mask.style.backgroundColor = "rgb(37, 31, 40)";
  mask.style.filter = "blur(5px)";
  const opacity = 1;
  mask.style.opacity = opacity;
  // mask.style.pointerEvents = "none" ;
  mask.style.transition = "opacity 0.3s ";
  mask.style.border = "";
  mask.style.display = "";

  // 准备工作 如果是bilibili 启用去除黑边选项
  (function removeblackside() {
    if (window.location.href.indexOf("bilibili") > 0) {
      let obj = localStorage.getItem("bilibili_player_settings");
      if (obj) {
        obj = JSON.parse(obj);
        obj.video_status.blackside_state = false;
      } else {
        obj = { video_status: { blackside_state: false } };
      }
      if (!localStorage.getItem("maskTop")) {
        localStorage.setItem("pbpstate", 0);
      }
      localStorage.setItem("bilibili_player_settings", JSON.stringify(obj));
    }
  })();

  function docReady(fn) {
    // see if DOM is already available
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      // call on next available tick
      setTimeout(fn, 1000);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }
  docReady(function () {
    let video = document.querySelector("video").parentNode?.parentNode;
    if (!video && window.location.href.indexOf("bilibili") > 0) {
      video =
        document.querySelector("video")?.parentNode?.parentNode ||
        // b站的非番剧视频用的竟然不是video标签真是让人匪夷所思
        document.querySelector("#bilibiliPlayer");
    }
    if (!video) return;
    function appendnode() {
      if (window.location.href.indexOf("bilibili") > 0) {
        mask.style.zIndex = 50;
      }
      video.appendChild(mask);
    }
    appendnode();
    function getposition() {
      videoRect = video.getBoundingClientRect();
      maskH = videoRect.height / 11;
      const maskT = localStorage.getItem("maskTop") || 0;
      mask.style.height = maskH + "px";
      mask.style.top =
        videoRect.top +
        window.scrollY +
        videoRect.height -
        maskH -
        maskT +
        "px";
      mask.style.left = videoRect.left - 25 + "px";
      mask.style.width = videoRect.width + 50 + "px";
      const maskShow = localStorage.getItem("maskShow") || "";
      mask.style.display = maskShow;
    }
    video.addEventListener("canplay", function () {
      appendnode();
      getposition();
    });
    // key press
    document.querySelector("html").onkeyup = function (e) {
      if (
        e.key === "c" &&
        e.target.nodeName !== "INPUT" &&
        e.target.nodeName !== "TEXTAREA"
      ) {
        if (e.metaKey || e.ctrlKey) {
          return;
        }
        // -> press c
        if (mask.style.display === "none") {
          appendnode();
          localStorage.setItem("maskShow", "");
          mask.style.display = "";
        } else {
          localStorage.setItem("maskShow", "none");
          mask.style.display = "none";
        }
      }
    };
    let resizeTimeout;
    function resizeThrottler() {
      // ignore resize events as long as an actualResizeHandler execution is in the queue
      if (!resizeTimeout) {
        resizeTimeout = setTimeout(function () {
          resizeTimeout = null;
          getposition();
        }, 300);
      }
    }
    new ResizeObserver(resizeThrottler).observe(video);
    mask.onmousedown = function () {
      if (resizeFlag !== true) {
        moveFlag = true;
        pointX = event.offsetX;
        pointY = event.offsetY;
      }
    };
    mask.onmouseup = function () {
      if (moveFlag) {
        moveFlag = false;
        resizeFlag = false;
        maskTop =
          videoRect.top +
          videoRect.height -
          mask.offsetTop -
          maskH -
          window.scrollY;
        if (maskTop < 0) {
          maskTop = 0;
        }
        localStorage.setItem("maskTop", maskTop);
        //   localStorage.setItem("maskLeft", mask.offsetLeft);
        localStorage.setItem("maskWidth", mask.offsetWidth);
        localStorage.setItem("maskHeight", mask.offsetHeight);
      }
    };
    mask.onmousemove = function () {
      if (moveFlag === true) {
        window.getSelection
          ? window.getSelection().removeAllRanges()
          : document.selection.empty();
        // mask.style.left = window.event.pageX - pointX + "px";
        mask.style.top = window.event.pageY - pointY + "px";
      } else if (resizeFlag === true) {
        window.getSelection
          ? window.getSelection().removeAllRanges()
          : document.selection.empty();
        mask.style.width = window.event.pageX - pointX + initialWidth + "px";
        mask.style.height = window.event.pageY - pointY + initialHeight + "px";
      }
    };
    mask.onmouseleave = function () {
      moveFlag = false;
      resizeFlag = false;
    };
    window.onscroll = function () {
      if (window.scrollY > 200) {
        mask.style.opacity = 0;
      } else {
        mask.style.opacity = opacity;
      }
    };
  });
})();
