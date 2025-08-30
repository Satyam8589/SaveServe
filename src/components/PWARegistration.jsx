"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    // Check if service workers are supported
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registered: ", registration);
          })
          .catch((registrationError) => {
            console.log(
              "Service Worker registration failed: ",
              registrationError
            );
          });
      });
    }

    // Add install prompt
    let deferredPrompt;
    const installButton = document.getElementById("install-button");

    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;

      // Update UI to notify the user they can add to home screen
      if (installButton) {
        installButton.style.display = "block";

        installButton.addEventListener("click", () => {
          // Hide the install button
          installButton.style.display = "none";

          // Show the install prompt
          deferredPrompt.prompt();

          // Wait for the user to respond to the prompt
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === "accepted") {
              console.log("User accepted the install prompt");
            } else {
              console.log("User dismissed the install prompt");
            }
            deferredPrompt = null;
          });
        });
      }
    });
  }, []);

  return null;
}

export default PWARegistration;
