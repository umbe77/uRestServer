import {rest, router} from '../index.js'

rest.createRest({
    port: 8088
})

rest.addMiddleware((svc) => {
    svc.context.helloMessage = "ciao"
})

rest.addMiddleware((svc) => {
    svc.context.helloMessage = "ciao second"
    svc.context.name = "Roberto"
})


router.get("/", (svc) => {
    svc.done({
        body: `context: ${svc.context.helloMessage} -- ${svc.context.name}`,
        headers: {
            'Content-Type': 'text/plain'
        }
    })
})

rest.run()
