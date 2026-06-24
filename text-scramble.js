document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".js-scramble");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  elements.forEach((el) => {
    const finalText = el.textContent.trim();
    let step = 0;
    const duration = 900;
    const speed = 35;
    const steps = duration / speed;

    function scramble() {
      let output = "";
      const progress = step / steps;

      for (let i = 0; i < finalText.length; i++) {
        if (finalText[i] === " ") {
          output += " ";
          continue;
        }

        if (progress * finalText.length > i) {
          output += finalText[i];
        } else {
          output += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      el.textContent = output;
      step++;

      if (step <= steps) {
        setTimeout(scramble, speed);
      } else {
        el.textContent = finalText;
      }
    }

    scramble();
  });
});