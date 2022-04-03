var app = new Vue({
    el: '#app',
    data: {
        preloader: true,
        SERVER_URL: 'https://rcdl-ga.vercel.app/api',
        modal: {
            shown: false,
            hasImage: false,
            imagePreview: '',
        },
        form: {
            url: '',
            name: '',
            description: '',
            custom_url: '',
        },
        generated_link: '',
    },
    mounted()
    {
        setTimeout(()=>{
            this.preloader = false;
        }, 1000);

        const URL_LINK = new URL(window.location.href);

        if (URL_LINK.pathname == '/link.html')
        {
            const generated_link = URL_LINK.searchParams.get('link');

            if (!generated_link)
            {
                window.location.href = 'index.html';
                return;
            }

            this.generated_link = `${this.SERVER_URL}/r/${generated_link}`;
        }

    },
    methods: {
        createNewUrl()
        {
            this.preloader = true;

            const formData = new FormData();
            formData.append('url', this.form.url);
            formData.append('custom_meta', this.modal.shown);

            if (this.modal.shown)
            {
                const [file] = this.$refs.file.files;

                formData.append('title', this.form.name);
                formData.append('description', this.form.description);
                formData.append('image', file);
                formData.append('slug', this.convertToSlug(this.form.custom_url));
            }

            

            $.ajax({
                method: 'post',
                url: `${this.SERVER_URL}/add_url`,
                enctype: 'multipart/form-data',
                data: formData,
                cache: false,
                processData: false,
                contentType: false,
                success: data => {

                    if (data.error)
                    {
                        alert(data.error);
                        this.preloader = false;
                    }

                    if (data.success)
                    {
                        window.location.href = 'link.html?link=' + data.success;
                    }

                    console.log(data);
                    
                },
                error: err => {
                    console.log(err);
                    alert('Something Error');
                    this.preloader = false;
                }
            })
        },
        convertToSlug(Text) {
            return Text.toLowerCase()
                       .replace(/ /g, '-')
                       .replace(/[^\w-]+/g, '');
        },
        removeImage()
        {
            const element = document.querySelector('#file');
            const [file]  = element.files;

            this.modal.imagePreview = '';
            this.modal.hasImage     = false;
            element.value = '';
        },
        processImage()
        {
            const element = document.querySelector('#file');
            const [file]  = element.files;

            if (!file)
            {
                element.value = '';
            }

            if ( file.size > 10485760 )
            {
                window.alert('Only 10MB Max');
                return;
            }

            this.modal.imagePreview = URL.createObjectURL(file);
            this.modal.hasImage     = true;
        },

        fallbackCopyTextToClipboard(text) {
            var textArea = document.createElement("textarea");
            textArea.value = text;
            
            // Avoid scrolling to bottom
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
          
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
          
            try {
              var successful = document.execCommand('copy');
              var msg = successful ? 'successful' : 'unsuccessful';
              console.log('Fallback: Copying text command was ' + msg);
            } catch (err) {
              console.error('Fallback: Oops, unable to copy', err);
            }
          
            document.body.removeChild(textArea);
          },
          copyTextToClipboard(text) {
            if (!navigator.clipboard) {
              fallbackCopyTextToClipboard(text);
              return;
            }
            navigator.clipboard.writeText(text).then(function() {
              console.log('Async: Copying to clipboard was successful!');
            }, function(err) {
              console.error('Async: Could not copy text: ', err);
            });
          }
          

    },
})

Vue.component(window.Vue2Transitions)