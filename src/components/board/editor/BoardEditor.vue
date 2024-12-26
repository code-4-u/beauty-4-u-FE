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

// Image 익스텐션 설정 강화
const CustomImage = Image.configure({
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

// 이미지 삽입 함수 개선
const insertImage = (url) => {
  if (!editor.value || !url) return;

  editor.value.chain()
      .focus()
      .setImage({
        src: url,
        alt: 'Uploaded image',
        title: 'Uploaded image'
      })
      .run();

  // 명시적으로 콘텐츠 업데이트 emit
  emit("update:modelValue", editor.value.getHTML());
};

// 이미지 제거 함수 개선
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
    // 명시적으로 콘텐츠 업데이트 emit
    emit("update:modelValue", editor.value.getHTML());
  }
};

// URL 교체를 위한 새로운 메소드 추가
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

// watch 로직 개선
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue, false);
  }
}, { deep: true });

defineExpose({
  insertImage,
  removeImage,
  replaceImageUrls // 새로운 메소드 노출
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
.button-group {
  display: flex;
  gap: 4px;
}

button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 10px;
  margin: 5px;
  color: #000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  &.is-active {
    color: #1976d2;
    background-color: rgba(25, 118, 210, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .heading-level {
    font-size: 0.8em;
    margin-left: 2px;
  }
}

.heading-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }
}

.editor-content {
  margin-top: 1rem;
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

  img {
    max-width: 100%;
    height: auto;
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