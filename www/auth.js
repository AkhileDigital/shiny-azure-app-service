$(document).ready(function () {
    // Wait until Shiny is fully initialized
    $(document).on('shiny:connected', function(event) {
        console.log("Shiny connected. Attempting to fetch Azure AD user data...");

        $.get("https://az-auth-test-stage.azurewebsites.net/.auth/me", function (data) {
            // Log the raw data received from the /.auth/me endpoint
            console.log("Raw data from /.auth/me:", data);

            let name = "unknown";
            let preferredUsername = "unknown";
            let userId = "unknown";
            let roles = []; // Initialize roles as an empty array

            // Check if the data is in the expected format (an array with at least one element)
            if (data && Array.isArray(data) && data.length > 0) {
                const clientPrincipal = data[0]; // The first element usually contains the client principal

                // Ensure user_claims array exists
                if (clientPrincipal && Array.isArray(clientPrincipal.user_claims)) {
                    const claims = clientPrincipal.user_claims;

                    // Extract Name
                    const nameClaim = claims.find(claim => claim.typ === 'name');
                    if (nameClaim && nameClaim.val) {
                        name = nameClaim.val;
                    } else {
                        console.log("Name claim (typ: 'name') not found or has no value.");
                    }

                    // Extract Preferred Username
                    const preferredUsernameClaim = claims.find(claim => claim.typ === 'preferred_username');
                    if (preferredUsernameClaim && preferredUsernameClaim.val) {
                        preferredUsername = preferredUsernameClaim.val;
                    } else {
                        console.log("Preferred username claim (typ: 'preferred_username') not found or has no value.");
                    }

                    // Extract Roles
                    // Common claim types for roles are 'roles' or 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
                    roles = claims.filter(claim =>
                        (claim.typ === 'roles' || claim.typ === 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role') && claim.val
                    ).map(claim => claim.val);

                    if (roles.length === 0) {
                        console.log("No roles claim found (typ: 'roles' or 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'), or user has no assigned roles in the token.");
                    }
                } else {
                    console.log("user_claims array not found in the response data[0].");
                }

                // Extract User ID (often the preferred_username or a subject identifier)
                if (clientPrincipal && clientPrincipal.user_id) {
                    userId = clientPrincipal.user_id;
                } else {
                     console.log("user_id not found directly in data[0]. It might be within claims if needed differently.");
                }

            } else {
                console.log("User data from /.auth/me was not in the expected format (e.g., empty or not an array). Defaulting to 'unknown'.");
            }
            
            // Creating an object with all extracted data
            const userData = {
                name: name,
                preferred_username: preferredUsername,
                user_id: userId,
                roles: roles
            };

            // Log the structured user data that will be sent to Shiny
            console.log("Extracted User Data to be sent to Shiny:", userData);
            
            // Send the extracted data to Shiny
            Shiny.setInputValue("AzureAuth", userData, {priority: "event"});
            
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // Log detailed error information if the AJAX call fails
            console.error("Could not retrieve user data from Entra ID via /.auth/me.");
            console.error("Status: " + textStatus);
            console.error("Error Thrown: " + errorThrown);
            if (jqXHR.responseText) {
                console.error("Response Text:", jqXHR.responseText);
            }
            
            // Set default "unknown" data for Shiny in case of failure
            const userData = {
                name: "unknown",
                preferred_username: "unknown",
                user_id: "unknown",
                roles: [] // Default to empty roles array on failure
            };

            console.log("Setting default unknown data for Shiny due to AJAX failure.");
            Shiny.setInputValue("AzureAuth", userData, {priority: "event"});
        });
    });

    // Optional: Handle cases where Shiny might disconnect or never connect
    // This is more advanced and depends on specific application needs.
    // For example, you could set a timeout.
    let shinyConnectedTimeout = setTimeout(function() {
        if (!window.Shiny || !window.Shiny.setInputValue) {
            console.warn("Shiny does not seem to be available after a timeout. Azure AD data fetch was not initiated via Shiny connection event.");
            // Potentially call the $.get directly here if Shiny is not part of the page,
            // or handle this scenario as an error.
        }
    }, 10000); // 10 second timeout

    $(document).on('shiny:connected', function(event) {
        clearTimeout(shinyConnectedTimeout); // Clear timeout if Shiny connects
    });
});
