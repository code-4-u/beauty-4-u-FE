<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import Image from '@tiptap/extension-image';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Heading } from '@tiptap/extension-heading';

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const selectedHeading = ref('none');

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit, Image, Heading],
  onUpdate: () => {
    emit("update:modelValue", editor.value.getHTML());
  },
});

const changeHeading = () => {
  if (!editor.value) return;

  if (selectedHeading.value === 'none') {
    editor.value.chain().focus().setParagraph().run();
  } else {
    editor.value.chain().focus().toggleHeading({ level: Number(selectedHeading.value) }).run();
  }
};

watch(() => props.modelValue, (value) => {
  const isSame = editor.value.getHTML() === value;
  if (!isSame) {
    editor.value.commands.setContent(value, false);
  }
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
          <!-- 기존 버튼들 -->
          <div class="button-group">
            <button
                @click="editor.chain().focus().toggleBold().run()"
                :disabled="!editor.can().chain().focus().toggleBold().run()"
                :class="{ 'is-active': editor.isActive('bold') }"
            >
              <font-awesome-icon :icon="['fas', 'bold']" />
            </button>
            <button
                @click="editor.chain().focus().toggleItalic().run()"
                :disabled="!editor.can().chain().focus().toggleItalic().run()"
                :class="{ 'is-active': editor.isActive('italic') }"
            >
              <font-awesome-icon :icon="['fas', 'italic']" />
            </button>
            <button
                @click="editor.chain().focus().toggleStrike().run()"
                :disabled="!editor.can().chain().focus().toggleStrike().run()"
                :class="{ 'is-active': editor.isActive('strike') }"
            >
              <font-awesome-icon :icon="['fas', 'strikethrough']" />
            </button>
          </div>

          <div class="select-group">
            <select v-model="selectedHeading" @change="changeHeading" class="heading-select">
              <option value="1">헤딩 1</option>
              <option value="2">헤딩 2</option>
              <option value="3">헤딩 3</option>
              <option value="none">헤딩 없음</option>
            </select>
          </div>

          <div class="button-group">
            <button
                @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
            >
              <i class="fas fa-heading"></i><span class="heading-level">2</span>
            </button>
            <button
                @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
            >
              <i class="fas fa-heading"></i><span class="heading-level">3</span>
            </button>
          </div>

          <div class="button-group">
            <button
                @click="editor.chain().focus().undo().run()"
                :disabled="!editor.can().chain().focus().undo().run()"
            >
              <i class="fas fa-undo"></i>
            </button>
            <button
                @click="editor.chain().focus().redo().run()"
                :disabled="!editor.can().chain().focus().redo().run()"
            >
              <i class="fas fa-redo"></i>
            </button>
          </div>
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
}

.editor-container {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 900px;
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
  background-color: #f5f5f5;
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