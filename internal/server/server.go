package server

import (
	"io/fs"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"nestkeeper/web"
)

func New() *echo.Echo {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Register API routes
	RegisterRoutes(e)

	// Serve embedded frontend
	serveFrontend(e)

	return e
}

func serveFrontend(e *echo.Echo) {
	// Get the dist subdirectory from the embedded filesystem
	distFS, err := fs.Sub(web.DistFS, "dist")
	if err != nil {
		e.Logger.Warn("Frontend dist not found, skipping static file serving")
		return
	}

	// Create file server
	fileServer := http.FileServer(http.FS(distFS))

	// Serve static files and handle SPA routing
	e.GET("/*", echo.WrapHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip API routes
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		// Try to serve the file
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		// Check if file exists
		f, err := distFS.Open(strings.TrimPrefix(path, "/"))
		if err != nil {
			// File not found, serve index.html for SPA routing
			r.URL.Path = "/index.html"
		} else {
			f.Close()
		}

		fileServer.ServeHTTP(w, r)
	})))
}
