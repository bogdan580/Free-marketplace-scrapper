document.addEventListener(
  "DOMContentLoaded",
  function () {
    var checkPageButton = document.getElementById("checkPage");
    checkPageButton.addEventListener(
      "click",
      function () {
        chrome.tabs.getSelected(null, function (tab) {
          if (checkPageButton.style.background !== "blue") {
            findingStarted(checkPageButton);
            var queryInput = document.getElementById("query");
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "startProcess", query: queryInput.value});
              }
            );
          } else {
            findingStoped(checkPageButton);
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "stopProcess" });
              }
            );
          }
        });
      },
      false
    );
  },
  false
);

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { action: "getStatus" },
    function (response) {
      var checkPageButton = document.getElementById("checkPage");
      var queryInput = document.getElementById("query");
      var it = document.getElementById("iterator");
      if (response && response.FINDING === true) {
        findingStarted(checkPageButton);
        queryInput.value = response.query;
        it.innerHTML = response.iterator;
      } else if (response && response.FINDING === false) {
        findingStoped(checkPageButton);
        queryInput.value = response.query;
        it.innerHTML = '';
      } else {
        console.log("Nie udało się odczytać zmiennej z content.js");
      }
    }
  );
});

function findingStarted(button) {
  button.style.background = "blue";
  button.style.color = "#FFDD00";
  button.innerHTML = "Stop";
}

function findingStoped(button) {
  button.style.background = "#FFDD00";
  button.style.color = "blue";
  button.innerHTML = "Let's go";
}