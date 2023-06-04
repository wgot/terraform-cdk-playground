import { Request, Response, http } from '@google-cloud/functions-framework'

http('HelloWorldFunction', (_req: Request, res: Response) => {
    res.send('OK')
})
