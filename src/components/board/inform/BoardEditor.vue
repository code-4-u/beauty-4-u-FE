<script setup>
import {onBeforeUnmount, ref, watch} from 'vue';
import StarterKit from "@tiptap/starter-kit";
import {EditorContent, useEditor} from "@tiptap/vue-3";
import Image from '@tiptap/extension-image';
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {Heading} from '@tiptap/extension-heading'

// Props 정의
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

// Emits 정의
const emit = defineEmits(["update:modelValue"]);

const selectedHeading = ref('none'); // 기본 선택값

// Reactive 데이터
const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit, Image, Heading],
  onUpdate: () => {
    emit("update:modelValue", editor.value.getHTML());
  },
});

const changeHeading = () => {
  if (!editor) return;

  if (selectedHeading.value === 'none') {
    editor.chain().focus().setHeading('paragraph').run(); // 기본 텍스트로 전환
  } else {
    editor.chain().focus().toggleHeading({ level: Number(selectedHeading.value) }).run();
  }
};

// Watcher 설정
watch(() => props.modelValue, (value) => {
  const isSame = editor.value.getHTML() === value;

  if (!isSame) {
    editor.value.commands.setContent(value, false);
  }
});

// Lifecycle hooks
onBeforeUnmount(() => {
  editor.value.destroy();
});
</script>

<template>
  <v-app>
    <div v-if="editor">
      <!-- 에디터 옵션 버튼 -->
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
      <select v-model="selectedHeading" @change="changeHeading">
        <option value="1">헤딩 1</option>
        <option value="2">헤딩 2</option>
        <option value="3">헤딩 3</option>
        <option value="none">헤딩 없음</option>
      </select>

      <button
          @click="editor?.chain().focus().undo().run()"
          :disabled="!editor?.can().chain().focus().undo().run()"
      >
        <v-icon>mdi-undo</v-icon>
      </button>

      <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
      >
        <v-icon icon="mdi-format-header-2"></v-icon>
      </button>
      <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
      >
        <v-icon icon="mdi-format-header-3"></v-icon>
      </button>
      <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().chain().focus().undo().run()"
      >
        <v-icon icon="mdi-undo"></v-icon>
      </button>
      <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().chain().focus().redo().run()"
      >
        <v-icon icon="mdi-redo"></v-icon>
      </button>

      <div>
        <h1>아이콘 예제</h1>
        <v-icon icon="mdi-home">mdi-home</v-icon>
        <v-icon icon="mdi-account">mdi-account</v-icon>
      </div>
    </div>

    <!-- 에디터 영역 -->
    <editor-content :editor="editor" />
  </v-app>
</template>

<style lang="scss">
button {
  background-color: transparent; // 배경색 설정
  border: none; // 테두리 제거
  cursor: pointer; // 커서 변경
  padding: 10px; // 패딩 추가
  margin: 5px; // 버튼 간 간격 설정
  color: #000; // 글자색 설정

  &:hover {
    background-color: rgba(0, 0, 0, 0.1); // 호버 시 배경색
  }

  &.is-active {
    color: #1976d2; // 활성화 상태 색상
  }
}

.ProseMirror {
  height: 100%;
  border: 1px solid black;
  border-radius: 10px;
  padding: 6px;
  overflow: scroll;

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
