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

            spa = container "Single-Page Application" "Lets the user enter numbers, choose an operation and see the result." "TypeScript, React 19" "SPA" {

                # Presentation
                appPage = component "App" "Composes the calculator page." "React component" "Interface"
                calculatorForm = component "Calculator Form" "Number inputs, operation picker and per-field validation messages." "React component" "Interface"
                resultPanel = component "Result Panel" "Shows the result, the loading state or the API error." "React component" "Interface"

                # State
                calculationHook = component "useCalculation" "Holds the calculation state: idle, loading, success or error." "React hook" "Application"

                # Domain (pure TypeScript)
                operationCatalog = component "Operation Catalog" "The seven operations, their symbols and input labels." "TypeScript" "Domain"
                inputValidation = component "Input Validation" "Accepts plain decimal numbers only; checks format, not math rules." "TypeScript" "Domain"
                numberFormatting = component "Number Formatting" "Writes expressions and results without float noise." "TypeScript" "Domain"

                # Infrastructure
                apiClient = component "Calculator API Client" "Calls the API with a 10 s timeout and turns Problem Details into user messages." "fetch" "Infrastructure"
            }

            # ---------------- Service ----------------

            api = container "Calculator API" "Exposes one REST endpoint per operation, validates every request and documents itself with OpenAPI." "Go 1.27, net/http" "API" {

                # Composition root (cmd/server)
                serverBootstrap = component "Server Bootstrap" "Builds the router and runs the HTTP server with timeouts and graceful shutdown." "Go, cmd/server" "Bootstrap"

                # Interface layer (internal/httpapi, api)
                router = component "Router" "Maps method and path to a handler; answers 404 and 405." "net/http ServeMux" "Interface"
                operationHandlers = component "Operation Handlers" "One shared handler for two-operand operations, one for square root." "Go, httpapi" "Interface"
                requestDecoder = component "Request Decoder" "Strict JSON decoding: required fields, no unknown fields, 1 KiB limit." "Go, httpapi" "Interface"
                problemResponder = component "Problem Responder" "Writes JSON results and maps errors to Problem Details: 400, 413, 422." "Go, httpapi" "Interface"
                healthHandler = component "Health Handler" "Reports that the service is up." "Go, httpapi" "Interface"
                apiDocs = component "API Docs" "Serves the OpenAPI contract and Swagger UI, embedded in the binary." "Go, go:embed" "Interface"

                # Domain layer (internal/calculator)
                operations = component "Arithmetic Operations" "Add, subtract, multiply, divide, power, square root and percentage." "Go, calculator" "Domain"
                resultGuard = component "Result Guard" "Rejects ±Inf and NaN, normalizes -0. Every result passes through it." "Go, calculator" "Domain"
            }
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

        # ====================================================================
        #  RELATIONSHIPS - COMPONENT LEVEL
        # ====================================================================

        # --- Single-Page Application ---
        user -> calculatorForm "Types the numbers and picks the operation in" "Web UI"
        user -> resultPanel "Reads the result in" "Web UI"
        appPage -> calculatorForm "Renders" "Function call"
        appPage -> resultPanel "Renders" "Function call"
        appPage -> calculationHook "Runs the calculations through" "Function call"
        calculatorForm -> operationCatalog "Reads the operations and input labels from" "Function call"
        calculatorForm -> inputValidation "Validates the input before submitting with" "Function call"
        resultPanel -> numberFormatting "Formats the expression and the result with" "Function call"
        calculationHook -> apiClient "Requests the calculation from" "Function call"
        apiClient -> webApplication "Sends POST /api/v1/{operation} to" "JSON / HTTP"

        # --- Calculator API ---
        webApplication -> router "Forwards /api and /docs requests to" "HTTP"
        serverBootstrap -> router "Builds and serves" "Function call"
        router -> operationHandlers "Dispatches POST /api/v1/{operation} to" "Function call"
        router -> healthHandler "Dispatches GET /health to" "Function call"
        router -> apiDocs "Dispatches GET /docs to" "Function call"
        operationHandlers -> requestDecoder "Decodes the request body with" "Function call"
        operationHandlers -> operations "Calculates the result with" "Function call"
        operationHandlers -> problemResponder "Writes the result or the error with" "Function call"
        operations -> resultGuard "Checks every result with" "Function call"
        problemResponder -> operations "Maps the sentinel errors of the domain to 422" "Function call"

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
        #  COMPONENTS
        # ================================================================
        component api "Components-CalculatorApi" "Calculator API by layer. Dependencies point inwards: the domain knows nothing about HTTP." {
            include *
            autoLayout lr 300 300
        }

        component spa "Components-SPA" "Single-page application by layer: presentation, state, domain and API client." {
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

            # The color of a component shows the layer it belongs to
            element "Component" {
                shape RoundedBox
                background #dddddd
                color #1f1f1f
            }
            element "Interface" {
                background #fff2cc
                color #1f1f1f
            }
            element "Application" {
                background #cfe2f3
                color #1f1f1f
            }
            element "Domain" {
                background #d9ead3
                color #1f1f1f
            }
            element "Infrastructure" {
                background #f4cccc
                color #1f1f1f
            }
            element "Bootstrap" {
                background #eeeeee
                color #1f1f1f
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
