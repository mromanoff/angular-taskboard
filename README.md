# Angular Taskboard

A modern task management application built with Angular 21 and Material Design. Track your tasks with an intuitive drag-and-drop interface, organize by priority and status, and visualize your productivity with comprehensive analytics.

## Features

- **Kanban Board Interface**: Drag and drop tasks between To Do, In Progress, and Done columns
- **Task Management**: Create, edit, and delete tasks with title, description, priority, and due dates
- **Smart Filtering**: Filter tasks by priority, status, overdue status, or search by keywords
- **Analytics Dashboard**: View task statistics and charts including completion rates and priority distribution
- **Material Design**: Clean, modern UI with light/dark theme support
- **Real-time Updates**: Instant UI updates using Angular signals for reactive state management

## Development Server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project for production:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. The production build is optimized for performance and speed.

For development builds with file watching:

```bash
npm run watch
```

## Running Tests

To execute unit tests with Vitest:

```bash
npm test
```

The project uses Vitest for fast, modern testing with comprehensive coverage reporting.

## Technology Stack

- **Angular 21**: Latest Angular framework with standalone components
- **Angular Material**: Material Design components and theming
- **Chart.js & ng2-charts**: Data visualization for analytics
- **Angular CDK**: Drag-and-drop functionality
- **RxJS**: Reactive programming for state management
- **Vitest**: Modern, fast unit testing framework

## Project Structure

```
src/app/
├── components/       # UI components (tasks, dashboard, dialogs)
├── services/        # Business logic (task service, theme service)
└── models/          # TypeScript interfaces and types
```

## Additional Resources

For more information on Angular development, visit the [Angular Documentation](https://angular.dev).
