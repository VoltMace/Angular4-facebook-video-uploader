import { Http, Response, RequestOptions, Headers, URLSearchParams } from '@angular/http';
import { Injectable } from '@angular/core';
import { retry } from 'rxjs/operator/retry';


@Injectable()
export class FacebookVideoUploader {

    readonly url: string = "https://graph-video.facebook.com/v2.6/me/videos";
    access_token: string;
    form: FormData;
    settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://graph-video.facebook.com/v2.6/me/videos",
        "method": "POST",
        "processData": false,
        "contentType": false,
        "mimeType": "multipart/form-data",
        "data": this.form
    }
 

    constructor(private _http: Http) { 
    }

    Config(token: string) {
        this.access_token = token;
    }

    size: number;
    VideoChunks: Blob[] = [];
    Name: string;
    Description: string;
    upload_session_id: string;
    CurrentChunk: number = 0;


    UploadFile(file: Blob, name: string, description: string) {
        this.Name = name;
        this.size = file.size;
        this.Description = description;
        this.ToChunks(file);
        this.startSending();
    }

    ToChunks(file: Blob) {
        var chunkSize = this.GetChunkSize(file.size);// Math.ceil(file.size / 4);
        var fileSize = file.size;
        var chunks = Math.ceil(file.size / chunkSize);
        var chunk = 0;
        while (chunk <= chunks) {
            var offset = chunk * chunkSize;
            var t = file.slice(offset, offset + chunkSize);
            if (t.size > 0)
                this.VideoChunks.push(t);
            chunk++;
        }
    }

    GetChunkSize(filesize: number) {
        if (filesize < 4000000)
            return filesize;
        let count = Math.ceil(filesize / 4000000);
        return filesize / count;
    }

    startSending() {
        this.form = new FormData();
        this.form.append("title", this.Name);
        this.form.append("file_size", this.size.toString());
        this.form.append("upload_phase", "start");
        this.form.append("access_token", this.access_token); 
        this._http.post(this.url + '?access_token=' + this.access_token, this.form, this.settings).subscribe(this.OnStartedUpLoad.bind(this));
    }

    OnStartedUpLoad(response: any) {
        this.size = 0;
        let json = response.json(); 
        this.upload_session_id = json.upload_session_id;
        console.log(json);
        this.SendChunk()
    }

    SendChunk() {
        this.form = new FormData();
        this.form.append("start_offset", this.size.toString());
        this.form.append("video_file_chunk", this.VideoChunks[this.CurrentChunk]);
        this. form.append("upload_phase", "transfer");
        this.form.append("access_token", this.access_token);
        this.form.append("upload_session_id", this.upload_session_id); 
        this._http.post(this.url + '?access_token=' + this.access_token, this.form, this.settings).subscribe(this.OnChunkSended.bind(this)); 
    }

    OnChunkSended(response) {
        let json = response.json();
        this.size += this.VideoChunks[this.CurrentChunk].size;
        this.CurrentChunk++;
        if (json.start_offset == json.end_offset) {
            this.finishSending();
        }
        else
            this.SendChunk()
    }

    finishSending() {
        this.form = new FormData();
        this.form.append("upload_phase", "finish");
        this.form.append("access_token", this.access_token);
        this.form.append("upload_session_id", this.upload_session_id); 
        this._http.post(this.url + '?access_token=' + this.access_token, this.form, this.settings).subscribe(this.OnFinishLoaded.bind(this)); 
    }

    OnFinishLoaded(response) {
        let json = response.json();
        this.size = 0;
        this.VideoChunks = [];
        this.Name = null;
        this.Description = null;
        this.upload_session_id = null;
        this.CurrentChunk = 0;
    }
}

