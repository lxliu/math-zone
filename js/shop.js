// 解锁逻辑
import { commit } from "./store.js";
import { animalById } from "./animals.js";

export function canUnlock(account, animal) {
  return account && animal && !account.ownedAnimals.includes(animal.id) && account.stars >= animal.price;
}

// 返回是否成功解锁
export function tryUnlock(accountId, animalId) {
  const animal = animalById(animalId);
  if (!animal) return false;
  let ok = false;
  commit((s) => {
    const acc = s.accounts.find((a) => a.id === accountId);
    if (!acc) return;
    if (acc.ownedAnimals.includes(animalId)) return;
    if (acc.stars < animal.price) return;
    acc.stars -= animal.price;
    acc.ownedAnimals.push(animalId);
    ok = true;
  });
  return ok;
}
