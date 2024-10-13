declare module 'ejs-mate' {
    import { RequestHandler } from 'express';

    function ejsMate(): RequestHandler;

    export = ejsMate;
}