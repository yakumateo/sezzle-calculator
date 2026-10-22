workspace "Sezzle Calculator" "Full-stack calculator: a React single-page application that consumes a Go REST microservice." {

    model {

        !impliedRelationships false

        # ====================================================================
        #  PEOPLE
        # ====================================================================

        user = person "User" "Performs calculations in a web browser, on desktop or mobile." "User"
        apiConsumer = person "API Consumer" "Developer who calls the REST API directly or explores it in Swagger UI." "Developer"

        # ====================================================================
        #  EXTERNAL SYSTEMS
        # ====================================================================

        cdn = softwareSystem "jsDelivr CDN" "Serves the Swagger UI scripts and styles." "External"

        # ====================================================================
        #  MAIN SYSTEM
        # ====================================================================

        calculator = softwareSystem "Sezzle Calculator" "Performs basic and advanced arithmetic operations through a web UI and a REST API." "Platform" {

            # ---------------- Web product ----------------

            webApplication = container "Web Application" "Delivers the static content and the single-page application to the browser, and proxies /api and /docs to the API." "nginx 1.28" "WebServer"

            spa = container "Single-Page Application" "Lets the user enter numbers, choose an operation and see the result." "TypeScript, React 19" "SPA"

            # ---------------- Service ----------------

            api = container "Calculator API" "Exposes one REST endpoint per operation, validates every request and documents itself with OpenAPI." "Go 1.27, net/http" "API"
        }

        # ====================================================================
        #  RELATIONSHIPS - SYSTEM LEVEL
        # ====================================================================

        user -> calculator "Performs calculations in" "HTTP"
        apiConsumer -> calculator "Calls the REST API and reads its documentation in" "JSON / HTTP"
        apiConsumer -> cdn "Loads the Swagger UI assets from" "HTTPS"

        # ====================================================================
        #  RELATIONSHIPS - CONTAINER LEVEL
        # ====================================================================

        user -> webApplication "Visits the calculator at" "HTTP"
        user -> spa "Enters numbers and reads the results in" "Web UI"
        apiConsumer -> webApplication "Calls the REST API and opens Swagger UI at" "JSON / HTTP"

        webApplication -> spa "Delivers the application to the user's browser" "HTTP"
        spa -> webApplication "Sends calculation requests to /api at" "JSON / HTTP"
        webApplication -> api "Forwards /api and /docs requests to (reverse proxy)" "HTTP"

    }

    configuration {
        scope softwaresystem
    }

    views {

        properties {
            # Keep the colors and shapes below when exporting to C4-PlantUML.
            "c4plantuml.tags" "true"
        }

        # ================================================================
        #  SYSTEM LANDSCAPE
        # ================================================================
        systemLandscape "SystemLandscape" "People involved, the calculator and the external services it relies on." {
            include *
            autoLayout lr 300 300
        }

        # ================================================================
        #  SYSTEM CONTEXT
        # ================================================================
        systemContext calculator "SystemContext" "Who uses the Sezzle Calculator and what it depends on." {
            include *
            autoLayout lr 300 300
        }

        # ================================================================
        #  CONTAINERS
        # ================================================================
        container calculator "Containers" "The Web Application delivers the SPA and proxies its calls to the Calculator API." {
            include *
            autoLayout lr 300 300
        }

        # ================================================================
        #  STYLES
        # ================================================================
        styles {

            element "Element" {
                fontSize 22
            }

            element "Person" {
                shape Person
                background #4a5f7a
                color #ffffff
            }
            element "User" {
                background #0b5f8a
            }
            element "Developer" {
                background #5a6b7f
            }
            element "External" {
                background #9a9a9a
                color #ffffff
            }

            element "Software System" {
                background #1168bd
                color #ffffff
                shape RoundedBox
            }
            element "Platform" {
                background #0d8f5c
                color #ffffff
            }

            element "Container" {
                background #2e7cb8
                color #ffffff
                shape RoundedBox
            }
            element "WebServer" {
                shape Folder
                background #2e7cb8
            }
            element "SPA" {
                shape WebBrowser
                background #1168bd
            }
            element "API" {
                background #17607f
            }

            relationship "Relationship" {
                thickness 2
                color #666666
                fontSize 20
                dashed false
            }
        }
    }
}
