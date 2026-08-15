/* ============================================================
   relativity-quest 進捗管理・クイズ判定
   quest-template（design-system.css）の見た目に対して、
   ステージ一覧の描画・localStorageでの進捗保存・クイズ正誤判定を行う。
   ============================================================ */
(function (global) {
  "use strict";

  var STORAGE_KEY = "relativityQuestProgress";

  var BOOK_RECOMMEND = {
    title: "福江純『「超」入門 相対性理論 アインシュタインは何を考えたのか』（ブルーバックス）",
    url: "https://www.amazon.co.jp/dp/4065149088?tag=senjin-22"
  };

  var STAGES = [
    { n: 1, file: "stage1.html", title: "光の速さは秒速30万km", sub: "相対性理論のはじまり" },
    { n: 2, file: "stage2.html", title: "光の速さは誰から見ても同じ", sub: "光速不変の原理" },
    { n: 3, file: "stage3.html", title: "動くと時間が遅れる", sub: "光時計と時間の遅れ" },
    { n: 4, file: "stage4.html", title: "動くと縮んで見える", sub: "ローレンツ収縮" },
    { n: 5, file: "stage5.html", title: "「同時」は人によって違う", sub: "同時性の相対性" },
    { n: 6, file: "stage6.html", title: "双子のパラドックスの種明かし", sub: "うさ美自身の視点でも、答えは変わらない" }
  ];

  function getCleared() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function setCleared(stageNum) {
    var cleared = getCleared();
    if (cleared.indexOf(stageNum) === -1) {
      cleared.push(stageNum);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
    }
  }

  function isUnlocked(stageNum, cleared) {
    if (stageNum === 1) return true;
    return cleared.indexOf(stageNum - 1) !== -1 || cleared.indexOf(stageNum) !== -1;
  }

  function renderSidebar(currentStage) {
    var list = document.getElementById("side-list");
    if (!list) return;
    var cleared = getCleared();
    list.innerHTML = "";
    STAGES.forEach(function (stage) {
      var unlocked = isUnlocked(stage.n, cleared);
      var isCleared = cleared.indexOf(stage.n) !== -1;
      var item = document.createElement(unlocked ? "a" : "div");
      item.className = "side-item";
      if (stage.n === currentStage) item.className += " active";
      if (!unlocked) item.className += " locked";
      if (unlocked) {
        item.href = stage.file;
        item.setAttribute("aria-label", stage.title);
      } else {
        item.setAttribute("aria-disabled", "true");
      }
      var icon = isCleared ? "✅" : unlocked ? "🔓" : "🔒";
      item.innerHTML =
        '<span class="side-icon">' + icon + '</span>' +
        '<span class="side-text"><div class="side-main">STAGE' + stage.n + " " + stage.title + '</div>' +
        '<div class="side-sub">' + stage.sub + "</div></span>";
      list.appendChild(item);
    });
  }

  function updateHeaderProgress() {
    var cleared = getCleared();
    var total = STAGES.length;
    var label = document.getElementById("progress-label");
    var fill = document.getElementById("progress-fill");
    if (label) label.textContent = "クリア " + cleared.length + " / " + total;
    if (fill) fill.style.width = Math.round((cleared.length / total) * 100) + "%";
  }

  function markSolved(card) {
    card.setAttribute("data-solved", "true");
    var explain = card.querySelector(".quiz-explain");
    if (explain) explain.hidden = false;
  }

  function allSolved(root) {
    var cards = root.querySelectorAll(".quiz-card[data-quiz]");
    if (cards.length === 0) return true;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute("data-solved") !== "true") return false;
    }
    return true;
  }

  function initQuiz(stageNum, onAllSolved) {
    var cards = document.querySelectorAll(".quiz-card[data-quiz]");
    cards.forEach(function (card) {
      var buttons = card.querySelectorAll(".choice-btn");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (card.getAttribute("data-solved") === "true") return;
          var correct = btn.getAttribute("data-correct") === "true";
          if (correct) {
            buttons.forEach(function (b) { b.disabled = true; });
            btn.classList.add("choice-ok");
            markSolved(card);
            if (allSolved(document)) {
              onAllSolved();
            }
          } else {
            btn.classList.add("choice-ng");
          }
        });
      });
    });
  }

  function setMissionAchieved() {
    var status = document.getElementById("mission-status");
    if (status) {
      status.textContent = "達成！";
      status.classList.add("ok");
    }
  }

  function enableNext(stageNum) {
    var nextBtn = document.getElementById("btn-next");
    if (nextBtn) nextBtn.disabled = false;
    setCleared(stageNum);
    updateHeaderProgress();
  }

  function bindResetAll() {
    var btn = document.getElementById("btn-reset-all");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (window.confirm("進捗をすべてリセットして最初からやり直しますか？")) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "index.html";
      }
    });
  }

  function renderBookRecommend() {
    var el = document.getElementById("book-recommend");
    if (!el) return;
    el.innerHTML =
      '<p class="book-recommend-label">参考文献</p>' +
      '<div class="book-recommend-body">' +
      '<div>' +
      '<p class="book-recommend-lead">もっと深く学びたい方へ</p>' +
      '<a href="' + BOOK_RECOMMEND.url + '" target="_blank" rel="sponsored noopener">' + BOOK_RECOMMEND.title + "</a>" +
      "</div>" +
      "</div>";
  }

  function bindSidebarToggle() {
    var shell = document.getElementById("app-shell");
    if (!shell) return;
    function toggleSide() { shell.classList.toggle("side-collapsed"); }
    var t1 = document.getElementById("sidebar-toggle");
    var t2 = document.getElementById("head-nav-toggle");
    var backdrop = document.getElementById("side-backdrop");
    if (t1) t1.addEventListener("click", toggleSide);
    if (t2) t2.addEventListener("click", toggleSide);
    if (backdrop) backdrop.addEventListener("click", function () { shell.classList.add("side-collapsed"); });
  }

  function initStagePage(stageNum) {
    document.addEventListener("DOMContentLoaded", function () {
      var cleared = getCleared();
      if (!isUnlocked(stageNum, cleared)) {
        window.location.href = "index.html";
        return;
      }
      renderSidebar(stageNum);
      updateHeaderProgress();
      bindResetAll();
      bindSidebarToggle();
      renderBookRecommend();

      var nextBtn = document.getElementById("btn-next");
      var alreadyCleared = cleared.indexOf(stageNum) !== -1;

      if (alreadyCleared) {
        var cards = document.querySelectorAll(".quiz-card[data-quiz]");
        cards.forEach(function (card) {
          card.setAttribute("data-solved", "true");
          var explain = card.querySelector(".quiz-explain");
          if (explain) explain.hidden = false;
          card.querySelectorAll(".choice-btn").forEach(function (b) { b.disabled = true; });
        });
        setMissionAchieved();
        if (nextBtn) nextBtn.disabled = false;
      } else if (allSolved(document) === false) {
        if (nextBtn) nextBtn.disabled = true;
      }

      initQuiz(stageNum, function () {
        setMissionAchieved();
        enableNext(stageNum);
      });

      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          var next = STAGES[stageNum]; // stageNum is 1-indexed, so STAGES[stageNum] is the next stage
          window.location.href = next ? next.file : "index.html";
        });
      }
    });
  }

  function initCoverPage() {
    document.addEventListener("DOMContentLoaded", function () {
      var cleared = getCleared();
      document.querySelectorAll(".quest-card[data-stage]").forEach(function (card) {
        var n = parseInt(card.getAttribute("data-stage"), 10);
        if (!isUnlocked(n, cleared)) {
          card.classList.add("locked");
          card.removeAttribute("href");
        }
        if (cleared.indexOf(n) !== -1) {
          var cta = card.querySelector(".q-cta");
          if (cta) cta.textContent = "クリア済み ✓";
        }
      });
      renderBookRecommend();
    });
  }

  global.RQ = {
    STAGES: STAGES,
    getCleared: getCleared,
    initStagePage: initStagePage,
    initCoverPage: initCoverPage
  };
})(window);
