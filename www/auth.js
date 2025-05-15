$(document).ready(function () {
    // Wait until Shiny is fully initialized
    $(document).on('shiny:connected', function(event) {
        $.get("https://az-auth-test-stage.azurewebsites.net/.auth/me", function (data) {
            // Print the entire data object to the console
            console.log("Raw data from /.auth/me:", data);

            // Extracting the user's name, preferred_username, and user_id
            // It's good practice to add checks to ensure data[0] and data[0].user_claims exist
            let name = "unknown";
            let preferredUsername = "unknown";
            let userId = "unknown";

            if (data && data.length > 0 && data[0].user_claims) {
                const nameClaim = data[0].user_claims.find(claim => claim.typ === 'name');
                if (nameClaim) {
                    name = nameClaim.val;
                }

                const preferredUsernameClaim = data[0].user_claims.find(claim => claim.typ === 'preferred_username');
                if (preferredUsernameClaim) {
                    preferredUsername = preferredUsernameClaim.val;
                }

                userId = data[0].user_id;
            } else {
                console.log("User data or claims not found in the expected format. Defaulting to 'unknown'.");
            }
            
            // Creating an object with extracted data
            const userData = {
                name: name,
                preferred_username: preferredUsername,
                user_id: userId
            };

            Shiny.setInputValue("AzureAuth", userData);
            
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // Log the error details to the console
            console.error("Could not retrieve user data from Entra ID. Status: " + textStatus + ", Error: " + errorThrown);
            console.error("Response Text:", jqXHR.responseText); // Log the full response text for more details
            const userData = {
                name: "unknown",
                preferred_username: "unknown",
                user_id: "unknown"
            };
            Shiny.setInputValue("AzureAuth", userData);
        });
    });
});
