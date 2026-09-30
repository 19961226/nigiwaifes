jQuery(function ($) {
  "use strict";

  const SPEED = 350;
  const HEADER_OFFSET = 80;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 見出しの文字分割（1文字ずつ色替え）
  const CHAR_COLORS = ["red", "orange", "green", "blue"];
  $(".js-split").each(function (index) {
    const $title = $(this);
    const text = $title.text().trim();
    const offset = index % CHAR_COLORS.length;
    $title.attr("aria-label", text).empty();
    Array.from(text).forEach(function (char, i) {
      const color = CHAR_COLORS[(i + offset) % CHAR_COLORS.length];
      $("<span>", {
        class: "sec__char sec__char--" + color,
        text: char,
        "aria-hidden": "true",
        style: "--i:" + i,
      }).appendTo($title);
    });
  });

  // FVタイトル：ホバーで弾む（登場後は消えない）
  $(".fv__title-char")
    .on("animationend", function (e) {
      const name = e.originalEvent.animationName;
      if (name === "charBounce" || name === "softFade") $(this).addClass("is-landed");
      if (name === "charJump") $(this).removeClass("is-jump");
    })
    .on("mouseenter", function () {
      const $char = $(this);
      if (reduceMotion || !$char.hasClass("is-landed") || $char.hasClass("is-jump")) return;
      $char.addClass("is-jump");
    });

  // ハンバーガーメニュー
  const $hamburger = $("#js-hamburger");
  const $drawer = $("#js-drawer");

  function closeDrawer() {
    $hamburger.removeClass("is-checked").attr({ "aria-expanded": "false", "aria-label": "メニューを開く" });
    $drawer.removeClass("is-checked");
    $("body").removeClass("is-fixed");
  }

  $hamburger.on("click", function () {
    $(this).toggleClass("is-checked");
    $drawer.toggleClass("is-checked");
    $("body").toggleClass("is-fixed");
    const isOpen = $(this).hasClass("is-checked");
    $(this).attr({ "aria-expanded": String(isOpen), "aria-label": isOpen ? "メニューを閉じる" : "メニューを開く" });
  });

  $(".js-drawerLink").on("click", closeDrawer);

  $(window).on("resize", function () {
    if (window.innerWidth >= 1024) closeDrawer();
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && $drawer.hasClass("is-checked")) closeDrawer();
  });

  // スムーススクロール
  $('a[href^="#"]').on("click", function (e) {
    const href = $(this).attr("href");
    const $target = $(href === "#" || href === "" ? "html" : href);
    if (!$target.length) return;
    e.preventDefault();
    const position = href === "#fv" ? 0 : $target.offset().top - HEADER_OFFSET + 1;
    // scroll-snap と干渉しないよう一時的に解除
    $("html").css("scroll-snap-type", "none");
    $("html, body")
      .stop()
      .animate({ scrollTop: position }, reduceMotion ? 0 : 600, "swing", function () {
        $("html").css("scroll-snap-type", "");
      });
  });

  // ページトップボタン
  const $pagetop = $("#js-pagetop");
  function togglePagetop() {
    $pagetop.toggleClass("is-show", $(window).scrollTop() >= 80);
  }
  $(window).on("scroll", togglePagetop);
  togglePagetop();

  // スクロールアニメーション
  // リスト内のカードは順番に時間差をつける
  $(".point__list, .contents__list, .entry__steps, .faq__list").each(function () {
    $(this)
      .children(".js-fadeUp")
      .each(function (i) {
        $(this).css("animation-delay", i * 0.12 + "s");
      });
  });

  const fadeTargets = document.querySelectorAll(".js-fadeUp");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-show");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    fadeTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    $(fadeTargets).addClass("is-show");
  }

  // タイムテーブルのタブ
  const $tabs = $(".js-tab");
  function activateTab($tab) {
    const target = $tab.data("tab");
    $tabs.removeClass("is-active").attr({ "aria-selected": "false", tabindex: "-1" });
    $tab.addClass("is-active").attr({ "aria-selected": "true", tabindex: "0" });
    // hidden を切り替えると行のアニメーションが最初から再生される
    $(".js-panel").removeClass("is-active").attr("hidden", true);
    $("#" + target).addClass("is-active").removeAttr("hidden");
  }

  $tabs.on("click", function () {
    activateTab($(this));
  });

  $tabs.on("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const index = $tabs.index(this);
    const next = e.key === "ArrowRight" ? (index + 1) % $tabs.length : (index - 1 + $tabs.length) % $tabs.length;
    const $next = $tabs.eq(next);
    activateTab($next);
    $next.trigger("focus");
  });

  // 会場マップ
  const $mapInfo = $("#js-mapInfo");
  function openArea(area) {
    $(".js-mapArea").removeClass("is-active").filter("button").attr("aria-pressed", "false");
    // ピンのアニメーションを再生し直すためにリフローを挟む
    const $targets = $('.js-mapArea[data-area="' + area + '"]');
    void document.body.offsetWidth;
    $targets.addClass("is-active").filter("button").attr("aria-pressed", "true");
    $mapInfo.addClass("is-open");
    $mapInfo.find(".map__detail").removeClass("is-active");
    $mapInfo.find('.map__detail[data-area="' + area + '"]').addClass("is-active");
  }

  $(".js-mapArea").on("click", function () {
    openArea($(this).data("area"));
  });

  $(".js-mapArea").on("keydown", function (e) {
    if (this.tagName.toLowerCase() === "button") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openArea($(this).data("area"));
    }
  });

  // FAQ
  $(".faq__head").on("click", function () {
    const $item = $(this).closest(".faq__item");
    const $body = $item.find(".faq__body");
    if ($item.hasClass("is-open")) {
      $item.removeClass("is-open");
      $(this).attr("aria-expanded", "false");
      $body.stop().slideUp(SPEED);
    } else {
      $item.addClass("is-open");
      $(this).attr("aria-expanded", "true");
      $body.stop().slideDown(SPEED);
    }
  });

  // 申し込みフォームの入力チェック
  const $form = $("#js-form");
  const $result = $("#js-formResult");
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError($field, id, message) {
    $("#" + id).text(message);
    $field.toggleClass("is-error", message !== "").attr("aria-invalid", message !== "" ? "true" : "false");
    return message === "";
  }

  const validators = {
    name: function () {
      const $input = $("#entry-name");
      const value = $input.val().trim();
      return setError($input, "error-name", value === "" ? "お名前を入力してください。" : "");
    },
    email: function () {
      const $input = $("#entry-email");
      const value = $input.val().trim();
      let message = "";
      if (value === "") message = "メールアドレスを入力してください。";
      else if (!EMAIL_PATTERN.test(value)) message = "メールアドレスの形式が正しくありません。（例：info@example.com）";
      return setError($input, "error-email", message);
    },
    workshop: function () {
      const $choices = $form.find('input[name="workshop"]').closest(".form__choices");
      const checked = $form.find('input[name="workshop"]:checked').length > 0;
      return setError($choices, "error-workshop", checked ? "" : "参加したいワークショップを1つ以上選択してください。");
    },
    number: function () {
      const $select = $("#entry-number");
      return setError($select, "error-number", $select.val() === "" ? "参加人数を選択してください。" : "");
    },
  };

  // 入力中・選択時にもチェック
  $("#entry-name").on("blur", validators.name);
  $("#entry-email").on("blur", validators.email);
  $("#entry-number").on("change", validators.number);
  $form.find('input[name="workshop"]').on("change", validators.workshop);

  // 参加費の目安を計算
  function calcTotal() {
    const number = Number($("#entry-number").val()) || 0;
    let sum = 0;
    $form.find('input[name="workshop"]:checked').each(function () {
      sum += Number($(this).data("price"));
    });
    const total = sum * number;
    $("#js-totalPrice").text(total.toLocaleString("ja-JP"));
    return total;
  }
  $form.find('input[name="workshop"], #entry-number').on("change", calcTotal);
  calcTotal();

  $form.on("submit", function (e) {
    e.preventDefault();
    let isValid = true;
    Object.keys(validators).forEach(function (key) {
      if (!validators[key]()) isValid = false;
    });

    if (!isValid) {
      $result.removeClass("is-show").text("");
      const $firstError = $form.find(".is-error").first();
      const $focusTarget = $firstError.is("input, select") ? $firstError : $firstError.find("input").first();
      $("html, body").animate({ scrollTop: $focusTarget.offset().top - HEADER_OFFSET - 60 }, reduceMotion ? 0 : 400);
      $focusTarget.trigger("focus");
      return;
    }

    // デモのため実際の送信は行わない
    $result.removeClass("is-show");
    void $result[0].offsetWidth;
    // 参加内容の確認を表示
    const workshops = $form
      .find('input[name="workshop"]:checked')
      .map(function () {
        return $(this).val();
      })
      .get();
    const $summary = $("<dl>", { class: "entry__summary" });
    [
      ["お名前", $("#entry-name").val().trim()],
      ["開催日", "11月20日（土）"],
      ["ワークショップ", workshops.join("、")],
      ["参加人数", $("#entry-number").val() + "名"],
      ["参加費の目安", calcTotal().toLocaleString("ja-JP") + "円（当日お支払い）"],
    ].forEach(function (row) {
      $("<div>").append($("<dt>").text(row[0]), $("<dd>").text(row[1])).appendTo($summary);
    });
    $result
      .empty()
      .append($("<p>", { class: "entry__result-title", text: "送信内容を確認しました（デモのため送信されません）" }), $summary)
      .addClass("is-show");
    const rect = document.getElementById("js-submit").getBoundingClientRect();
    burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  // ボタンを押すと紙吹雪が弾ける
  const CONFETTI_COLORS = ["#e03a2f", "#e86a00", "#169c55", "#1a7fd0", "#3cbbeb", "#f5b800", "#ff9ab0"];
  const CONFETTI_SHAPES = ["circle", "triangle", "rect"];

  function burstConfetti(x, y) {
    if (reduceMotion || typeof Element.prototype.animate !== "function") return;
    const count = 22;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      const shape = CONFETTI_SHAPES[i % CONFETTI_SHAPES.length];
      piece.className = "confetti confetti--" + shape;
      piece.style.backgroundColor = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      document.body.appendChild(piece);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const distance = 50 + Math.random() * 70;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 30;
      const rotate = (Math.random() - 0.5) * 720;

      piece
        .animate(
          [
            { transform: "translate(" + x + "px," + y + "px) scale(0.4) rotate(0deg)", opacity: 1 },
            { transform: "translate(" + (x + dx) + "px," + (y + dy) + "px) scale(1) rotate(" + rotate / 2 + "deg)", opacity: 1, offset: 0.55 },
            { transform: "translate(" + (x + dx * 1.15) + "px," + (y + dy + 70) + "px) scale(0.8) rotate(" + rotate + "deg)", opacity: 0 },
          ],
          { duration: 900 + Math.random() * 400, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" }
        )
        .finished.then(function () {
          piece.remove();
        });
    }
  }

  $(".js-confetti").on("click", function (e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;
    burstConfetti(x, y);
  });
});
