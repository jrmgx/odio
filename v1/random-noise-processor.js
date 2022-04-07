class RandomNoiseProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.t = 0;

        // This is for init only and will be replaced by the onmessage block version
        this.fx = 't';
        this.f = new Function('t', 'x', 'y', 'm', 'return t');
        
        this.__a = 0;
        this.__b = 0;
        this.__c = 0;
        this.__d = 0;
        this.__e = 0;
        this.__f = 0;
        this.__g = 0;
        this.__h = 0;
        this.__i = 0;
        this.__j = 0;

        this.port.onmessage = (e) => {
            this.fx = e.data;

            let exp = this.fx
                // Replacing a-j letters to internal properties
                // This could probably have been done with some closure magics but I was lazy
                .replaceAll(/(^|\W)([a-j])(\W|$)/g, '$1this.__$2$3')
                // At start I used javascript Math version but I decided to implement mine
                //.replaceAll(/(sin|cos|random)/g, 'Math.$&')
                .replaceAll(/(sin|cos|rand)/g, 'this.$&')
            ;
            try {
                this.f = new Function('t', 'x', 'y', 'm', `t = ( ${exp} ); return t;`);
                this.port.postMessage({success: true});
            } catch {
                // Send message to parent
                this.port.postMessage({success: false});
            }
            console.log(this.f + ' v1');
        }
    }
    
    static get parameterDescriptors() {
        return [
            {name: "x", defaultValue: 128, minValue: 0, maxValue: 255},  
            {name: "y", defaultValue: 128, minValue: 0, maxValue: 255}, 
        ];
    }

    sin (x) {
        return ((Math.sin(x) + 1) / 2) * 255;
    }

    sin0 (x) {
        return Math.sin(x);
    }

    cos (x) {
        return ((Math.cos(x) + 1) / 2) * 255;
    }

    cos0 (x) {
        return Math.cos(x);
    }

    rand (x) {
        return Math.random() * 256;
    }

    rand0 (x) {
        return Math.random() > 0.5 ? 0 : 1;
    }

    process (inputs, outputs, parameters) {

        const output = outputs[0]
        const x = parameters.x[0];
        const y = parameters.y[0];
        
        // Input one (we have connected the microphone only)
        // Channel one (even if the microphone have two input, it's not important here)
        const inputChannelOne = inputs[0][0];
        
        output.forEach(channel => {
            for (let i = 0; i < channel.length; i++) {
                let m = 0;
                // At start the microphone is not ready
                if (typeof inputChannelOne !== 'undefined') {
                    m = ((inputChannelOne[i] + 1) / 2) * 256;
                }
                let w = Math.max(0, this.f(this.t, x, y, m));
                channel[i] = ((w % 256) / 256) * 2 - 1;
                this.t++;
            }
        })
        return true
    }
}

registerProcessor('random-noise-processor', RandomNoiseProcessor)
