<script setup>
import {onBeforeUnmount, watch} from 'vue';
import StarterKit from "@tiptap/starter-kit";
import {EditorContent, useEditor} from "@tiptap/vue-3";
import Image from '@tiptap/extension-image';
import MenuBar from './MenuBar.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

// Image 익스텐션 수정
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...Image.options.addAttributes?.() || {},
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: '150',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      height: {
        default: 'auto',
        renderHTML: attributes => ({
          height: attributes.height,
        }),
      },
    }
  },
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const container = document.createElement('div');
      container.classList.add('image-resizable-container');

      const img = document.createElement('img');
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        img.setAttribute(key, value);
      });

      // 크기 조절 핸들 추가
      const resizeHandle = document.createElement('div');
      resizeHandle.classList.add('resize-handle');

      let startX, startWidth;

      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = img.offsetWidth;

        const onMouseMove = (e) => {
          const dx = e.clientX - startX;
          const newWidth = startWidth + dx;
          if (newWidth > 50) { // 최소 크기 제한
            img.style.width = `${newWidth}px`;
          }
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          // 새 크기를 에디터 상태에 저장
          if (typeof getPos === 'function') {
            editor.commands.updateAttributes('image', {
              width: img.style.width,
            }, { at: getPos() });
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      container.appendChild(img);
      container.appendChild(resizeHandle);
      return { dom: container };
    };
  },
}).configure({
  inline: true,
  allowBase64: true,
  HTMLAttributes: {
    class: 'editor-image',
  },
});

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit, CustomImage],
  onUpdate: ({editor}) => {
    emit("update:modelValue", editor.getHTML());
  },
});

// 이미지 삽입 함수
const insertImage = (url, options = {}) => {
  if (!editor.value || !url) return;

  editor.value.chain()
      .focus()
      .setImage({
        src: url,
        alt: 'Uploaded image',
        title: 'Uploaded image',
        width: '150px',
        height: 'auto'
      })
      .run();

  emit("update:modelValue", editor.value.getHTML());
};

// 이미지 제거 함수
const removeImage = (url) => {
  if (!editor.value || !url) return;

  const transaction = editor.value.state.tr;
  let hasChanges = false;

  editor.value.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs.src === url) {
      transaction.delete(pos, pos + node.nodeSize);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    editor.value.view.dispatch(transaction);
    emit("update:modelValue", editor.value.getHTML());
  }
};

// URL 교체를 위한 새로운 메소드
const replaceImageUrls = (urlMap) => {
  if (!editor.value) return;

  const transaction = editor.value.state.tr;
  let hasChanges = false;

  editor.value.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') {
      const oldUrl = node.attrs.src;
      const newUrl = urlMap[oldUrl];

      if (newUrl) {
        transaction.setNodeMarkup(pos, null, {
          ...node.attrs,
          src: newUrl
        });
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    editor.value.view.dispatch(transaction);
    emit("update:modelValue", editor.value.getHTML());
  }
};

// watch 로직
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue, false);
  }
}, { deep: true });

defineExpose({
  insertImage,
  removeImage,
  replaceImageUrls
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="editor-wrapper">
    <div class="editor-container">
      <div class="editor-header">
        <h3 class="editor-title">텍스트 에디터</h3>
      </div>

      <div class="editor-divider"></div>

      <div class="editor-body">
        <div v-if="editor" class="editor-toolbar">
          <menu-bar :editor="editor" />
        </div>

        <div class="editor-content">
          <editor-content :editor="editor" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.editor-wrapper {
  padding: 1rem;
  width: 100%;
}

.editor-container {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  margin: 1rem auto;
}

.editor-header {
  padding: 1rem 1.5rem;
}

.editor-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.editor-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 0;
}

.editor-body {
  padding: 1rem;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.image-resizable-container {
  display: inline-block;
  position: relative;
  margin: 0 4px;

  img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .resize-handle {
    position: absolute;
    right: -6px;
    bottom: -6px;
    width: 12px;
    height: 12px;
    background-color: #1976d2;
    border: 2px solid white;
    border-radius: 50%;
    cursor: se-resize;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  &:hover .resize-handle {
    opacity: 1;
  }
}

.ProseMirror {
  min-height: 200px;
  max-height: 500px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  background-color: white;
  overflow-y: auto;

  &:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }

  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
  }

  pre {
    background: #0d0d0d;
    color: #fff;
    font-family: "JetBrainsMono", monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  .editor-image {
    min-width: 50px;
    max-width: 100%;
    height: auto;
    vertical-align: middle;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid rgba(#0d0d0d, 0.1);
  }

  hr {
    border: none;
    border-top: 2px solid rgba(#0d0d0d, 0.1);
    margin: 2rem 0;
  }
}
</style>