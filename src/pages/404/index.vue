<template>
    <div class="relative w-full h-[92vh]">
        <!-- CurvedLoop 背景层 -->
        <div class="absolute inset-0 bottom-[2%]">
            <FallingText text="The Page Is Not Found" :highlight-words="['404', 'Not Found']" trigger="hover"
                :gravity="1" font-size="2rem" :mouse-constraint-stiffness="0.2" />
        </div>
        <!-- 404文字前景层，不阻止事件 -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <FuzzyText text="404" :font-size="250" font-weight="900" :use-theme-color="true" :enable-hover="true"
                :base-intensity="0.2" :hover-intensity="0.5" />
        </div>
    </div>
</template>

<script setup lang="ts">
import FuzzyText from "@/components/404/FuzzyText.vue";
import FallingText from "@/components/404/FallingText.vue";
</script>
