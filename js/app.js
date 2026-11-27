/**
 * 互动流程：地点选择 → 两站都要走完 → 地图转场需点击进入
 * 改模拟比例请编辑 js/data.js 的 simPoll
 */
(function () {
  const D = window.NEWS_DATA;
  const app = document.getElementById("app");
  const screens = {
    cover: document.getElementById("screen-cover"),
    choose: document.getElementById("screen-choose"),
    huanghelou: document.getElementById("screen-huanghelou"),
    travel: document.getElementById("screen-travel"),
    bagong: document.getElementById("screen-bagong"),
    ending: document.getElementById("screen-ending"),
  };

  const ui = {
    back: document.getElementById("btn-back"),
    restart: document.getElementById("btn-restart"),
    restartEnd: document.getElementById("btn-restart-end"),
    progressText: document.getElementById("progress-text"),
    progressDots: document.getElementById("progress-dots"),
    huangChapter: document.getElementById("huang-chapter"),
    bagongChapter: document.getElementById("bagong-chapter"),
    panelSelfie: document.getElementById("panel-selfie"),
    panelPro: document.getElementById("panel-pro"),
    sim: document.getElementById("sim-shot"),
    simFeedback: document.getElementById("sim-feedback"),
    simSpeech: document.getElementById("sim-speech"),
    selfieStage1: document.getElementById("selfie-stage-1"),
    selfieStage2: document.getElementById("selfie-stage-2"),
    startQueue: document.getElementById("btn-start-queue"),
    walker: document.getElementById("walker"),
    travelTitle: document.getElementById("travel-title"),
    travelCopy: document.getElementById("travel-copy"),
    mapFrom: document.getElementById("map-from-name"),
    mapTo: document.getElementById("map-to-name"),
    comicStage: document.getElementById("comic-stage"),
    travelArrive: document.getElementById("travel-arrive"),
    coverMapImg: document.getElementById("cover-map-img"),
    coverMapSlot: document.getElementById("cover-map-slot"),
    arriveText: document.getElementById("arrive-text"),
    enterNext: document.getElementById("btn-enter-next"),
    huangCast: document.getElementById("huang-cast"),
    simAward: document.getElementById("sim-award"),
    awardTitle: document.getElementById("award-title"),
    awardPct: document.getElementById("award-pct"),
    awardNote: document.getElementById("award-note"),
    simAfter: document.getElementById("sim-after"),
    continueSim: document.getElementById("btn-continue-sim"),
    simResult: document.getElementById("sim-result"),
  };

  const NAMES = { huanghelou: D.places.huanghelou.name, bagong: D.places.bagong.name };
  const FOLIO = {
    cover: { text: "封面", dots: "01" },
    choose: { text: "选地点", dots: "02" },
    huanghelou: { text: "旅程 1/2", dots: "03" },
    bagong: { text: "旅程 1/2", dots: "03" },
    travel: { text: "途中", dots: "—" },
    ending: { text: "终章", dots: "04" },
  };

  const SIM = {
    wait: {
      title: "恭喜你，获得称号：氛围感守候大师！",
      copy: "你没有抢戏，也把路让给了镜头。街角这点默契，其实挺珍贵。",
    },
    pass: {
      title: "恭喜你，获得称号：灵活走位选手！",
      copy: "轻轻绕开，拍照的人、走路的人，各自都还在画面里。",
    },
    talk: {
      title: "恭喜你，获得称号：社交协调官！",
      copy: "一句「我过一下？」就够了。秩序有时候是聊出来的。",
    },
  };

  let state = initialState();
  let travelTimer = null;
  let travelTimer2 = null;
  let travelRaf = 0;

  function initialState() {
    return {
      screen: "cover",
      history: [],
      visited: { huanghelou: false, bagong: false },
      firstStop: null,
      pendingNext: null,
      huangChoice: null,
      simChoice: null,
    };
  }

  function bindData() {
    document.querySelectorAll("[data-bind]").forEach((el) => {
      const keys = el.dataset.bind.split(".");
      let val = D;
      keys.forEach((k) => { val = val ? val[k] : ""; });
      if (val != null) el.textContent = val;
    });
  }

  function showScreen(name, { push = true } = {}) {
    if (push && state.screen && state.screen !== name) state.history.push(state.screen);
    state.screen = name;
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle("is-active", key === name);
    });
    app.dataset.scene = name;
    app.scrollTo({ top: 0, behavior: "smooth" });
    updateChrome();
  }

  function updateChrome() {
    ui.back.hidden = state.screen === "cover" || (state.screen === "travel" && ui.travelArrive.hidden);
    ui.restart.hidden = state.screen === "cover";
    const meta = { ...FOLIO[state.screen] };
    if (state.screen === "huanghelou" || state.screen === "bagong") {
      const done = Number(state.visited.huanghelou) + Number(state.visited.bagong);
      const n = Math.min(done + 1, 2);
      meta.text = `旅程 ${n}/2`;
      meta.dots = n === 1 ? "03" : "04";
    }
    ui.progressText.textContent = meta.text;
    ui.progressDots.textContent = meta.dots;
    ui.huangChapter.textContent = state.firstStop === "bagong" ? "下一站" : "第一站";
    ui.bagongChapter.textContent = state.firstStop === "huanghelou" ? "下一站" : "第一站";
  }

  function startTravel(from, to) {
    state.pendingNext = to;
    if (ui.mapFrom) ui.mapFrom.textContent = NAMES[from];
    if (ui.mapTo) ui.mapTo.textContent = NAMES[to];
    ui.travelTitle.textContent = "途中";
    ui.travelCopy.textContent = "好啦，下一站出发！";
    ui.arriveText.textContent = `终于到啦！欢迎来到${NAMES[to]}！`;
    ui.enterNext.innerHTML = `进入${NAMES[to]} <i class="ink-arrow"></i>`;
    ui.travelArrive.hidden = true;
    if (ui.comicStage) ui.comicStage.className = "travel-replay";
    showScreen("travel");
    mountTravelWalk(from, to);
  }

  function walkerMarkup() {
    return `<div class="route-walker is-walk" id="walker" aria-hidden="true">
      <svg class="hiker" viewBox="0 0 80 120">
        <g fill="none" stroke="#2b221c" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <g class="hiker-body">
            <circle cx="42" cy="28" r="12" fill="#f4e2cc" />
            <path d="M32 20c8-10 24-6 24 6" />
            <circle cx="38" cy="27" r="1.6" fill="#2b221c" stroke="none" />
            <circle cx="48" cy="27" r="1.6" fill="#2b221c" stroke="none" />
            <path d="M38 33c4 3 8 3 10 0" />
            <path d="M42 40v6" />
            <path d="M28 52c8-8 30-6 32 8 2 16-8 28-18 28s-20-12-14-36z" fill="#e4c9a8" />
            <g class="hiker-pack">
              <path d="M22 50h14v24H20z" fill="#a9473d" />
            </g>
            <g class="hiker-cam">
              <rect x="54" y="54" width="16" height="11" rx="2" fill="#2b221c" />
              <circle cx="62" cy="59.5" r="3.2" stroke="#f4e2cc" />
            </g>
          </g>
          <g class="hiker-leg-l"><path d="M36 84l-8 28" /><path d="M24 112h16" /></g>
          <g class="hiker-leg-r"><path d="M48 84l12 28" /><path d="M50 112h18" /></g>
        </g>
      </svg>
    </div>`;
  }

  function mountTravelWalk(from, to) {
    const host = document.getElementById("travel-map-host");
    const src = document.getElementById("cover-map-slot");
    cancelAnimationFrame(travelRaf);
    clearTimeout(travelTimer);
    clearTimeout(travelTimer2);
    if (!host || !src) return;
    host.innerHTML = "";
    const clone = src.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    host.appendChild(clone);
    host.insertAdjacentHTML("beforeend", walkerMarkup());
    const walker = document.getElementById("walker");
    const svg = clone.querySelector(".sketch-map");
    const path = clone.querySelector(".dash-route");
    if (!walker || !svg || !path) return;

    const towardBagong = from === "huanghelou";
    const duration = 4200;
    const t0 = performance.now();

    function place(progress) {
      const u = towardBagong ? progress : 1 - progress;
      const len = path.getTotalLength();
      const pt = path.getPointAtLength(Math.max(0, Math.min(1, u)) * len);
      const svgPt = svg.createSVGPoint();
      svgPt.x = pt.x;
      svgPt.y = pt.y;
      const ctm = svg.getScreenCTM();
      const hostBox = host.getBoundingClientRect();
      if (!ctm) return;
      const page = svgPt.matrixTransform(ctm);
      walker.style.left = (page.x - hostBox.left) + "px";
      walker.style.top = (page.y - hostBox.top) + "px";
      walker.style.transform = towardBagong
        ? "translate(-50%, -88%) scaleX(-1)"
        : "translate(-50%, -88%)";
    }

    place(0);
    travelTimer = setTimeout(() => {
      ui.travelCopy.textContent = "走起来！背包、相机，一个都不能少。";
    }, 400);

    function tick(now) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      place(eased);
      if (p < 1) {
        travelRaf = requestAnimationFrame(tick);
      } else {
        walker.classList.remove("is-walk");
        walker.classList.add("is-stop");
        ui.travelArrive.hidden = false;
        updateChrome();
      }
    }
    travelRaf = requestAnimationFrame(tick);
  }

  function finishStop(stop) {
    state.visited[stop] = true;
    const leftover = !state.visited.huanghelou
      ? "huanghelou"
      : !state.visited.bagong
        ? "bagong"
        : null;
    if (leftover) startTravel(stop, leftover);
    else showScreen("ending");
  }

  function resetSim() {
    const box = document.getElementById("sim-choices");
    const result = ui.simResult;
    if (result && box) {
      result.classList.remove("is-show");
      box.appendChild(result);
    }
    if (ui.sim) ui.sim.className = "option-shot";
    if (ui.simAward) ui.simAward.classList.remove("is-show");
    if (ui.awardTitle) ui.awardTitle.textContent = "";
    if (ui.simFeedback) ui.simFeedback.textContent = "";
    if (ui.awardPct) ui.awardPct.textContent = "—";
    if (ui.awardNote) ui.awardNote.textContent = "";
    if (ui.simAfter) ui.simAfter.hidden = true;
    const use = document.querySelector("#sim-walker use");
    if (use) use.setAttribute("href", "#doodle-wait");
    state.simChoice = null;
    if (ui.selfieStage1) {
      ui.selfieStage1.classList.remove("is-hide");
      ui.selfieStage1.removeAttribute("hidden");
    }
    if (ui.selfieStage2) {
      ui.selfieStage2.classList.remove("is-show");
      ui.selfieStage2.setAttribute("hidden", "");
    }
  }

  function restart() {
    clearTimeout(travelTimer);
    clearTimeout(travelTimer2);
    cancelAnimationFrame(travelRaf);
    state = initialState();
    ui.panelSelfie.classList.remove("is-open");
    ui.panelPro.classList.remove("is-open");
    document.querySelectorAll(".choice-btn, .hotspot").forEach((btn) => btn.classList.remove("is-on"));
    ui.travelArrive.hidden = true;
    if (ui.comicStage) ui.comicStage.className = "travel-replay";
    const host = document.getElementById("travel-map-host");
    if (host) host.innerHTML = "";
    resetSim();
    showScreen("cover", { push: false });
    state.history = [];
  }

  function setHuangCast(kind) {
    const use = ui.huangCast && ui.huangCast.querySelector("use");
    if (use) use.setAttribute("href", kind === "pro" ? "#doodle-pose" : "#doodle-selfie");
  }

  function openHuangPanel(kind) {
    state.huangChoice = kind;
    document.querySelectorAll("[data-huang]").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.huang === kind);
    });
    setHuangCast(kind);
    const selfie = kind === "selfie";
    ui.panelSelfie.classList.toggle("is-open", selfie);
    ui.panelPro.classList.toggle("is-open", !selfie);
    if (ui.selfieStage1) {
      ui.selfieStage1.classList.toggle("is-hide", !selfie);
      ui.selfieStage1.removeAttribute("hidden");
    }
    if (ui.selfieStage2) {
      ui.selfieStage2.classList.remove("is-show");
      ui.selfieStage2.setAttribute("hidden", "");
    }
    const open = selfie ? ui.panelSelfie : ui.panelPro;
    setTimeout(() => open.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function showQueueStage() {
    if (ui.selfieStage1) {
      ui.selfieStage1.classList.add("is-hide");
      ui.selfieStage1.setAttribute("hidden", "");
    }
    if (ui.selfieStage2) {
      ui.selfieStage2.removeAttribute("hidden");
      ui.selfieStage2.classList.add("is-show");
      ui.selfieStage2.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function runSim(kind) {
    state.simChoice = kind;
    document.querySelectorAll("[data-sim]").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.sim === kind);
    });
    const row = document.querySelector('[data-sim-row="' + kind + '"]');
    const result = ui.simResult;
    const shot = ui.sim;
    const award = ui.simAward;
    if (!result || !shot || !award) return;
    if (row) row.after(result);
    result.classList.add("is-show");
    shot.className = "option-shot is-show is-" + kind;
    award.classList.add("is-show");
    const use = document.querySelector("#sim-walker use");
    if (use) {
      use.setAttribute("href", "#doodle-" + kind);
      use.setAttribute("xlink:href", "#doodle-" + kind);
    }
    const pack = SIM[kind];
    ui.awardTitle.textContent = pack.title;
    ui.simFeedback.textContent = pack.copy;
    ui.awardPct.textContent = D.simPoll[kind] + "%";
    ui.awardNote.textContent = D.simPoll.note;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function loadMapImage() {
    const slot = ui.coverMapSlot;
    const img = ui.coverMapImg;
    if (!slot || !img || !D.mapImage) return;
    img.onload = () => slot.classList.add("has-map");
    img.onerror = () => slot.classList.remove("has-map");
    img.src = D.mapImage;
  }

  function continueAfterSim() {
    if (ui.simAfter) {
      ui.simAfter.hidden = false;
      ui.simAfter.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function handlePress(t, e) {
    if (!t) return true;
    const action = t.getAttribute("data-action") || t.id;
    if (t.getAttribute("data-go") || action === "choose") {
      showScreen(t.getAttribute("data-go") || "choose");
      return true;
    }
    if (t.getAttribute("data-choose")) {
      const stop = t.getAttribute("data-choose");
      if (!state.visited.huanghelou && !state.visited.bagong) state.firstStop = stop;
      showScreen(stop);
      return true;
    }
    if (t.getAttribute("data-huang")) {
      openHuangPanel(t.getAttribute("data-huang"));
      return true;
    }
    if (action === "btn-start-queue" || action === "start-queue") {
      if (e) e.preventDefault();
      showQueueStage();
      return true;
    }
    if (t.getAttribute("data-sim")) {
      runSim(t.getAttribute("data-sim"));
      return true;
    }
    if (action === "btn-finish-huang") {
      finishStop("huanghelou");
      return true;
    }
    if (action === "btn-finish-bagong") {
      finishStop("bagong");
      return true;
    }
    if (action === "btn-enter-next") {
      if (state.pendingNext) showScreen(state.pendingNext, { push: false });
      return true;
    }
    if (action === "btn-continue-sim") {
      continueAfterSim();
      return true;
    }
    if (action === "btn-back") {
      if (state.screen === "travel" && ui.travelArrive.hidden) return true;
      const prev = state.history.pop();
      showScreen(prev || "cover", { push: false });
      return true;
    }
    if (action === "btn-restart" || action === "btn-restart-end") {
      restart();
      return true;
    }
    return false;
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("#app button, #app [data-go], #app [data-choose], #app [data-huang], #app [data-sim], #app [data-action]");
    if (!t) return;
    handlePress(t, e);
  });

  [
    "btn-start-queue",
    "btn-continue-sim",
    "btn-enter-next",
    "btn-finish-huang",
    "btn-finish-bagong",
    "btn-back",
    "btn-restart",
    "btn-restart-end",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      handlePress(el, e);
    });
  });

  window.__startQueue = showQueueStage;
  window.__runSim = runSim;

  bindData();
  loadMapImage();
  updateChrome();
})();
