document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Toolbar elements
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");

  // Function to fetch activities from API

  let allActivities = {};

  function renderActivities() {
    // Get search and sort values
    const searchValue = searchInput ? searchInput.value.toLowerCase() : "";
    const sortValue = sortSelect ? sortSelect.value : "name";

    // Convert activities to array for sorting/filtering
    let activityArray = Object.entries(allActivities).map(([name, details]) => {
      return {
        name,
        ...details,
        spotsLeft: details.max_participants - details.participants.length,
      };
    });

    // Filter by search
    if (searchValue) {
      activityArray = activityArray.filter(
        (a) =>
          a.name.toLowerCase().includes(searchValue) ||
          a.description.toLowerCase().includes(searchValue)
      );
    }

    // Sort
    if (sortValue === "name") {
      activityArray.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === "spots") {
      activityArray.sort((a, b) => b.spotsLeft - a.spotsLeft);
    }

    // Clear loading message
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = "<option value=''>-- Select an activity --</option>";

    activityArray.forEach((activity) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        activity.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${activity.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${activity.name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${activity.name}</h4>
        <p>${activity.description}</p>
        <p><strong>Schedule:</strong> ${activity.schedule}</p>
        <p><strong>Availability:</strong> ${activity.spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = activity.name;
      option.textContent = activity.name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Toolbar event listeners
  if (searchInput) {
    searchInput.addEventListener("input", renderActivities);
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", renderActivities);
  }

  // Initialize app
  fetchActivities();
});
