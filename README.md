# Angular4-facebook-video-uploader
Simple type script class  to upload video to facebook
Example of using

@Component({
    selector: 'test-video-component',
    templateUrl: 'test.facebook.component.html'
})
export class TestVideoComponent  {

    constructor(private uploader: FacebookVideoUploader) { 
        uploader.Config(this.access_token);
    }
    access_token = 'your access token';   
    
      LoadMultipleVideo() {
          let input: any = document.getElementById('testVideo');
          var file: Blob = input.files[0]; 
          this.uploader.UploadFile(file, 'name', 'desc'); 
      } 
    }
