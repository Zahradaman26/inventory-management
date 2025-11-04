import { Component } from '@angular/core';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.css'],
  imports: [
    QuillModule, FormsModule 
  ],
})
export class RichTextEditorComponent {
  editorContent: string = '';

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],        // toggled buttons
      [{ 'header': 1 }, { 'header': 2 }],     // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],                      // add's image support
      ['clean']                               // remove formatting button
    ]
  };
}
