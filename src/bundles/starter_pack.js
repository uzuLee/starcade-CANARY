module.exports = {
  id: 'starter_pack',
  name: '스타터 팩',
  description: 'Starcade를 시작하는 당신을 위한 저렴한 아이템 묶음입니다!',
  items: [
    { type: 'profileEffect', id: 'Wiggle' },
    { type: 'profileEffect', id: 'Sparkle' },
  ],
  // price: 3500, // 이 가격을 설정하면 아래 할인이 무시됩니다.
  discount: 15, // 포함된 아이템 가격 총합에서 15% 할인이 적용됩니다.
  isForSale: false,
};
