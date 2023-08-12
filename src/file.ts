export async function filePicker(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.multiple = true;
    input.webkitdirectory = true;

    input.addEventListener('change', () => {
      const files = input.files;

      if (files?.length) {
        resolve(files[0]);
      } else {
        reject();
      }

      console.log(files);
    });

    (input.showPicker ? input.showPicker() : input.click());
  });
}
