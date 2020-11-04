// Sends a post request to local backend that send the email
const method = 'POST';
const url = 'http://localhost:3000/email';

export function httpCall(data:any) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    if (data != null) {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
    }
    else xhr.send();
}