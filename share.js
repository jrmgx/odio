async function share(canvas, url) 
{
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const files = [new File([blob], 'screenshot.png')];
    const shareData = {
        title: 'Odio',
        text: 'Listen to my Odio creation',
        url: url,
        files: files,
    }
    function fallback (url) {
        prompt('You can copy/past this text to share your work', url);
    }
    if (navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData)
        } catch (err) {
            fallback(url);
            console.error(err);
        }
    } else {
        fallback(url);
        console.log(`Your system doesn't support sharing files.`);
    }
}

document.addEventListener('DOMContentLoaded', function () {

    const button = document.querySelector('button');
    const canvas = document.querySelector('canvas');

    button.addEventListener('click', async () => { await share(canvas, document.location); })

})
